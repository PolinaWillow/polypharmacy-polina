import * as d3 from 'd3';
import {GraphParser} from "./GraphParser/GraphParser"

export const d3Graph=(props)=>{
    const colors = {
        selectNode: "#E8BD6D",
        selectLink: "#8B7474",
        node: "#E9EEF4",
        link: '#B8B5B5'
    }

    const nodeView = {
        r: 30
    }

    const graphData = props.graphData
    const svgRef = props.svgRef
    const window = {width: props.size[0], height:  props.size[1], xStep:50, yStep: 100}

    const graphParser = new GraphParser();
    graphParser.Parse(graphData, window, nodeView);
    console.log(graphData)

    

    if (graphData && svgRef.current){
        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove() // Очистка предыдущего графа

        svg.attr("width",  window.width) //Устанавливает атрибут width
        .attr("height",  window.height)
        .append("g").attr('class', 'group') //добавляет новый элемент, тег которого передается в метод в качестве параметра

        const svgGroup = svg.select('g.group')

        // Масштабирование и перемещение
        const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", (event)=>{ //Обновление позиционирования элементов при масштабировании
            svgGroup.attr("transform", event.transform);
        });
        svg.call(zoom);


        const dragstarted = (event, d)=>{
            if (!event.active) simulation.alphaTarget(0.3).restart(); // Увеличиваем "температуру" симуляции для более плавного движения
            d.fx = d.x; // Фиксируем позицию узла
            d.fy = d.y;
        }
        
        const dragged = (event, d)=>{
            d.fx = event.x; // Обновляем фиксированные координаты узла
            d.fy = event.y;
        }
        
        const dragended = (event, d)=>{
            if (!event.active) simulation.alphaTarget(0); // Охлаждаем симуляцию после перетаскивания
            d.fx = null; // Отпускаем узел, позволяя симуляции снова влиять на его позицию
            d.fy = null;
        }

        // Создаем обработчик drag
        const drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);


        // Определение маркера стрелки
        svgGroup.append("defs")
        .append("marker")
        .attr("id", "arrowhead")
        .attr("markerWidth", 5) //Размер области, в которой будет отображаться маркер
        .attr("markerHeight", 4)
        .attr("refX", nodeView.r+4)
        .attr("refY", 2)
        .attr("orient", "auto")
        .append("polygon")
        .attr("points", "0 0, 5 2, 0 4")
        .style("fill", colors.link);

        
        //Добавление ссылок
        let links = svgGroup.append("g").attr('class', 'links')
        .selectAll('.link')
        .data(graphData.links) //Добавление данных
        .enter() //Нужен для ввода дополнительных значений (так как data привязывает только первое)
        .append('path')
        .attr('class', 'link')
        .attr('stroke', d=>{
            //if((d.source.id === selectedNodes.sourseNode && d.target.id === selectedNodes.targetNode)||(d.target.id === selectedNodes.sourseNode && d.source.id === selectedNodes.targetNode)) return colors.selectLink
            return colors.link
        }) // Цвет линии ребра
        .attr('stroke-width', d=>{
            //if((d.source.id === selectedNodes.sourseNode && d.target.id === selectedNodes.targetNode)||(d.target.id === selectedNodes.sourseNode && d.source.id === selectedNodes.targetNode)) return 2
            return 1
        }) // Ширина линии ребра
        .attr("marker-end", "url(#arrowhead)") // Добавление стрелки в конец ребра
        .style('pointer-events', 'none') //(устанавливает стиль) Отключение событий на ребрах (клики и т.д.)

        // Создание узлов
        let nodes = svgGroup.append("g").attr('class', 'nodes')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(drag);

        nodes.append('circle')
        .attr('class', 'node')
        .attr('id', d => d.id)
        .attr('r', d => d.r) // Радиус узла
        .attr('fill', d=>{
            //if(selectedNodes.sourseNode === d.id || selectedNodes.targetNode === d.id) return colors.selectNode
            return colors.node
        }) // Цвет заполнения
        .attr("cursor", "pointer")
        .on('click', (event, d) => {
            // Добавьте логику для обработки клика по узлу
        });

        //Отображение текста v2
        nodes.append('foreignObject')
        .attr('x', d => -d.r * 0.8)
        .attr('y', d => -d.r * 0.8)
        .attr('width', d => d.r * 1.6)
        .attr('height', d => d.r * 1.6)
        .append('xhtml:div')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('width', '100%')
        .style('height', '100%')
        .style('font-size', '5px')
        .style('text-anchor', 'middle')
        .style('word-wrap', 'break-word')
        .style('overflow', 'hidden')
        .style('pointer-events', 'none')
        .text(d => d.name);

        //Создание симуляции силы v3
        const simulation = d3.forceSimulation(graphData.nodes)
        // Связи между узлами
        .force("link", d3.forceLink(graphData.links).id(d => d.id))//.distance(nodeView.r*10)) //!!! Сила в зависимости от количества узлов в уровне!!!!!
        // Отталкивание узлов
        .force("charge", d3.forceManyBody(graphData.nodes).strength(d=>graphData.levelsInfo.levelNodesCount[d.level]*(-100)))//-3000))
        // Центрирование по x
        .force("center", d3.forceCenter(window.width / 2, window.height / 2))
        // Выравнивание по уровням
        .force("y", d3.forceY().strength(6)
            .y(d => window.height * ((d.level+1) / (graphData.maxLevel-1)))) //!!!!!!!!!!Уровень с большим числом узлов шире, чем с меньшим
        // Отталкивание по x в рамках одного уровня
        .force("x", d3.forceX().strength(0.05)
            .x(window.width / 2))
        // Дополнительная сила для предотвращения наложения узлов
        .force("collision", d3.forceCollide().radius(40));

        // Обновление позиций узлов и связей при каждой итерации симуляции
        //Обновление симуляции
        simulation.on('tick', () => {
            links.attr("d", d => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`);
            nodes.attr('transform', d => `translate(${d.x}, ${d.y})`); // Правильная позиция для групп
        });
    }

}
