const shell = require('electron').shell;

let app = {
    clientKoef: [0.35, 0.4, 0.45],

    times: [20, 30, 40],

    worker: null,

};

/**
 *
 * @param id
 * @param times
 * @param data
 */
function createChart(id, times, data) {

    c3.generate({
        bindto: '#' + id,
        data: {
            xs: {
                'data1': 'x1',
            },
            columns: [
                ['x1'].concat(times),
                ['data1'].concat(data),
            ]
        }
    });
}

/**
 * отдаем только среднее p
 *
 * @param data
 * @return {Array}
 */
function transformData(data) {
    let items = [];

    data.forEach(function (item) {
        items.push(item.average_p);
    });

    return items;
}

/**
 * Demo chart from file generated on server
 */
function getDataFromFile() {
    let xmlhttp = new XMLHttpRequest();
    let url = 'data.json';
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            let data = JSON.parse(xmlhttp.responseText);

            createChart('demo-times', app.times, transformData(data));
            createChart('demo-koef', app.clientKoef, transformData(data));
        }
    };
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
}

function createResultTable(data) {
    let table = `<table class="table table-hover table-responsive">
    <tr>
    <td>Average P</td>
    <td>Time</td>
    <td>Koef</td>
    <td>Status</td>
    </tr>`;

    let summary = 0;

    data.forEach(function (item) {
        summary += item.average_p;
        table += `<tr>
            <td>${item.average_p}</td>
            <td>${item.time}</td>
            <td>${item.koef}</td>
            <td>${item.average_p > 0.9 ? 'The number of parking spaces does not need to be changed' : 'Number of parking spaces is not enough, increase'}</td>
        </tr>`;
    });

    table += `</table> <p>${summary / data.length}</p> `;

    document.querySelector('.result-table').innerHTML = table;
}

function setStatus(status) {
    document.querySelector('.status').innerHTML = status;
}

function Application() {

    app.worker = new Worker('src/worker.js');

    app.worker.addEventListener('message', function(e) {
        let data = e.data;

        switch (data.cmd) {
            case 'start':
                setStatus(data.data);
                break;

            case 'working':
                setStatus(data.data);
                break;

            case 'finished':
                setStatus(data.data);
                createChart('times', app.times, data.items);
                createChart('koef', app.clientKoef, data.items);
                createResultTable(data.original);
                break;
        }

    }, false);

    document.querySelectorAll('.author').forEach(function (item) {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            shell.openExternal(this.href);
        });
    });

    document.querySelector('.run-demo').addEventListener('click', function () {
        getDataFromFile();
    });

    document.querySelector('.run-exp').addEventListener('click', function () {
        app.worker.postMessage({
            type: 'experiment',
            countPlaces: parseInt(document.querySelector('.place').value),
            countExperiment: parseInt(document.querySelector('.count-exp').value)
        });
    });


}

Application();

