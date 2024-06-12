from flask import Flask, request, jsonify
from flask_cors import CORS
import matplotlib
import matplotlib.pyplot as plt
import base64
from io import BytesIO
import networkx as nx
from itertools import combinations
from math import comb
import numpy as np
from scipy.integrate import odeint
matplotlib.use('Agg')  # Используем backend, который не требует GUI

app = Flask(__name__)
CORS(app)

@app.route('/process', methods=['POST'])
def process():
    # Получение данных из запроса
    data = request.json
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    # Извлечение параметров
    try:
        number = data['number']
        array1 = data['array1']
        array2 = data['array2']
        show_count = data['show_count']
        show_labels = data['show_labels']
    except KeyError as e:
        return jsonify({"error": f"Missing parameter: {str(e)}"}), 400

    def plot_to_base64(plt):
        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        buffer.seek(0)
        img_str = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()
        return img_str

    def generate_combinations(num_elements):
        combo_dict = {}
        index = 0
        for i in range(num_elements + 1):
            for combo in combinations(range(num_elements), i):
                combo_dict[tuple(combo)] = index
                index += 1
        return combo_dict

    # Функция для создания графа состояний
    def create_graph(num_elements, combo_dict):
        G = nx.DiGraph()
        num_states = sum(comb(num_elements, i) for i in range(num_elements + 1))
        for i in range(num_states):
            G.add_node(i)

        edge_labels = {}
        for combo, current_index in combo_dict.items():
            if len(combo) < num_elements:
                for j in range(num_elements):
                    if j not in combo:
                        new_combo = tuple(sorted(combo + (j,)))
                        new_index = combo_dict[new_combo]
                        G.add_edge(current_index, new_index)
                        edge_labels[(current_index, new_index)] = f'λ_{j + 1}'
            if len(combo) > 0:
                for j in combo:
                    new_combo = tuple(e for e in combo if e != j)
                    new_index = combo_dict[new_combo]
                    G.add_edge(current_index, new_index)
                    edge_labels[(current_index, new_index)] = f'μ_{j + 1}'

        return G, edge_labels

    # Функция для решения системы дифференциальных уравнений
    def solve_system(num_elements, lambdas, mus, combo_dict, t_max=10, num_points=100):
        num_states = sum(comb(num_elements, i) for i in range(num_elements + 1))

        def equations(y, t):
            dydt = np.zeros(num_states)
            for combo, i in combo_dict.items():
                for j in range(num_elements):
                    if j not in combo:
                        new_combo = tuple(sorted(combo + (j,)))
                        new_index = combo_dict[new_combo]
                        dydt[i] -= lambdas[j] * y[i]
                        dydt[new_index] += lambdas[j] * y[i]
                    if j in combo:
                        new_combo = tuple(e for e in combo if e != j)
                        new_index = combo_dict[new_combo]
                        dydt[i] += mus[j] * y[new_index]
                        dydt[new_index] -= mus[j] * y[new_index]
            return dydt

        y0 = np.zeros(num_states)
        y0[0] = 1  # начальное условие: все элементы работоспособны
        t = np.linspace(0, t_max, num_points)
        solution = odeint(equations, y0, t)
        return t, solution

    # Функция для построения графика
    def plot_solution(t, solution, num_elements):
        plots = []
        num_plots = (solution.shape[1] + (show_count-1)) // show_count
        for plot_index in range(num_plots):
            start = plot_index * show_count
            end = min((plot_index + 1) * show_count, solution.shape[1])
            for i in range(start, end):
                plt.plot(t, solution[:, i], label=f'Состояние {i+1}')
            plt.xlabel('Время')
            plt.ylabel('Вероятность')
            plt.title(f'Решение системы дифференциальных уравнений для {num_elements}-элементного сечения')
            plt.legend(bbox_to_anchor=(1.05, 1), loc="upper left")
            plots.append(plot_to_base64(plt))
        return plots

    num_elements = number
    combo_dict = generate_combinations(num_elements)
    G, edge_labels = create_graph(num_elements, combo_dict)
    pos = nx.spring_layout(G, k=0.3, iterations=100)
    plt.figure(figsize=(14, 14))
    nx.draw(G, pos, with_labels=True, node_size=500, node_color='lightblue', font_size=10, font_weight='normal')
    if show_labels:
        nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels)
    img_str1 = plot_to_base64(plt)

    t, solution = solve_system(num_elements, array1, array2, combo_dict)
    img_str2 = plot_solution(t, solution, num_elements)

    result = {
        "plot1": img_str1,
        "plot2": img_str2
    }

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)
