
let app = {
    // номер заявки
    index: 0,

    // время
    Tstart: 0,

    // к-во паркомест
    countPlaces: 400,

    // паркоместа
    places: [],

    maxClients: 700,

    maxTimeObserving: 180,

    clientKoef: [0.35, 0.4, 0.45],

    times: [20, 30, 40],

    // заявки
    orders: [],

    MAX_CLIENTS: 700,
    MAX_TIME_OBSERVING: 180,
};
app.places = createPlaces(app.countPlaces);

/**
 *
 * @param min
 * @param max
 * @return {number}
 */
function random(min = 0, max = 1) {
    return Math.random() * (max - min + 1) + min;
}

/**
 *
 * @param countClients
 * @param koefClient
 * @param maxTimeObserving
 * @return {number}
 */
function getDeltaT(countClients, koefClient, maxTimeObserving) {
    let L = (countClients * koefClient) / maxTimeObserving;

    let DeltaT = -1 / L * Math.log(random());

    if (DeltaT < 0) {
        DeltaT *= -1;
    }

    return DeltaT;
}

/**
 *
 * @param count
 * @return {Array}
 */
function createPlaces(count) {
    let places = [];

    for (let i = 0; i < count; i++) {
        places.push({
            status: 0
        });
    }

    return places;
}

/**
 *
 * @param places
 * @return {{index: null}}
 */
function isExistsFreePlaces(places) {

    let place = {index: null};

    for (let i = 0; i < places.length; i++) {
        if (places[i].status === 0) {
            place.index = i;
            break;
        }
    }

    return place;
}

/**
 * к-во обслуженых на общее к-во
 *
 * @param tServing
 * @param deltaT
 * @return {number}
 */
function served(tServing, deltaT) {
    // к-во обслуженых
    let N = 0;

    while (app.Tstart <= app.MAX_TIME_OBSERVING) {

        // время входа заявки в систему
        app.orders.push({
            index: app.index,
            timeEnter: app.Tstart + (deltaT),
        });

        for (let i = 0; i < app.countPlaces; i++) {
            // первое попавшиеся своб. паркоместо
            let place = isExistsFreePlaces(app.places);

            if (place.index !== null) {

                let time = app.orders[app.index].timeEnter + tServing;

                if (app.Tstart > time) {
                    app.places[place.index].status = 0;
                } else {
                    app.places[place.index].status = 1;
                }

                app.orders[app.index]['timeEnd'] = time;

                N++;

            }
        }

        // номер заявки
        app.index++;

        // таймер
        app.Tstart += deltaT;

    }

    let p = N / app.index;

    if (p >= 0.9) {
        console.log('К-во паркомест не нуждается в изменении', p);
    } else {
        console.log('К-во паркомест недостаточно, увеличьте', p);
    }

    app.places = createPlaces(app.countPlaces);
    app.orders = [];
    app.Tstart = 0;
    app.index = 0;

    return p;

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
 * Експеримент
 */
function experiment(countExperiment) {

    self.postMessage({cmd: 'start', data: 'Current status <strong>working<strong>'});

    let visualize = [];
    let timeLength = app.times.length;
    let timeKoef = app.clientKoef.length;
    let count = 0;

    const maxExperiments = countExperiment || 5;

    for (let i = 0; i < timeLength; i++) {

        for (let j = 0; j < timeKoef; j++) {

            let data = {};

            for (let k = 0; k < maxExperiments; k++) {

                let p = served(app.times[i], getDeltaT(
                    app.MAX_CLIENTS,
                    app.clientKoef[j],
                    app.MAX_TIME_OBSERVING
                ));

                let dataIndex = 'time_' + app.times[i] + '_koef_' + app.clientKoef[j];

                if (!data.hasOwnProperty('name')) {
                    data = {};
                    data['name'] = dataIndex;
                    data['items'] = [];
                    data['summary'] = 0;
                    data['average_p'] = 0;
                }

                data['summary'] += p;
                data['time'] = app.times[i];
                data['koef'] = app.clientKoef[j];
                data['items'].push(p);

                if (k === maxExperiments - 1) {
                    data['average_p'] = data['summary'] / data['items'].length;
                    visualize.push(data);
                    count++;
                    self.postMessage({cmd: 'working', data: 'Current status <strong>working - ' + dataIndex + '<strong>'});
                }

                if (i === timeLength - 1 && j === timeKoef - 1 && k === maxExperiments - 1) {
                    if (app.type === 'generate') {
                        createExampleData(visualize);
                    } else {
                        self.postMessage({
                            cmd: 'finished',
                            data: 'Current status <strong>finished<strong>',
                            items: transformData(visualize),
                            original: visualize
                        });
                    }
                }

            }

        }

    }
}

/**
 *
 * @param {String} type  [ generate, experiment ]
 * @param countPlaces
 * @param countExperiment
 */
function Application(type, countPlaces, countExperiment) {

    app.type = type;

    app.countPlaces = countPlaces || app.countPlaces;
    experiment(countExperiment || 10);

}

self.addEventListener('message', function (e) {
    let data = e.data;

    Application(e.data.type, data.countPlaces, data.countExperiment);
});