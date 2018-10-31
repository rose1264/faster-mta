const STATIONS_FOR_TRAIN_LINE_URL = `http://traintimelb-367443097.us-east-1.elb.amazonaws.com/getStationsByLine`;

function getStationsForTrainLine(trainLine) {
    return fetch(`${STATIONS_FOR_TRAIN_LINE_URL}/${trainLine}`)
        .then(a => a.text())
        .then(a => {
            return JSON.parse(JSON.parse(a));
        });
}

const REAL_TIME_FOR_STATION = `http://traintimelb-367443097.us-east-1.elb.amazonaws.com/getTime`;

function getRealTimeForStation(trainLine, station) {
    return fetch(`${REAL_TIME_FOR_STATION}/${trainLine}/${station}`)
        .then(a => a.json());
}

window.onhashchange = handleHashChange;

function handleHashChange() {
    const hash = location.hash.slice(1)
    const routes = hash.split("/");

    // TODO: Refactor this to use Open/Closed principle
    switch(routes[0]) {
        case "subway":
            if (routes[1]) {
                renderSubwayPage(routes[1]);
            } else {
                window.history.pushState({}, "", "#home");
            }
            break;
        case "realtime":
            const trainLine = routes[1];
            const station = routes[2];
            if (trainLine && station) {
                renderRealTime(trainLine, station);
            } else {
                window.history.pushState({}, "", "#home");
            }
            break;
        case "subway_map":
            renderSubwayMap();
            break;
        case "home":
        default:
            renderHomePage();
            break;
    }
}


const subways = [
    { name: 1, color: "red" },
    { name: 2, color: "red" },
    { name: 3, color: "red" },
    { name: 4, color: "green" },
    { name: 5, color: "green" },
    { name: 6, color: "green" },
    { name: 7, color: "purple" },
    { name: "A", color: "blue" },
    { name: "C", color: "blue" },
    { name: "E", color: "blue" },
    { name: "G", color: "lime" },
    { name: "B", color: "orange" },
    { name: "D", color: "orange" },
    { name: "F", color: "orange" },
    { name: "M", color: "orange" },
    { name: "J", color: "brown" },
    { name: "Z", color: "brown" },
    { name: "L", color: "gray" },
    { name: "S", color: "gray" },
    { name: "N", color: "yellow" },
    { name: "R", color: "yellow" },
    { name: "Q", color: "yellow" },
    
];

function renderHomePage() {
    const ulEle = document.createElement("ul");
    subways.forEach(subway => {
        const liEle = document.createElement("li");
        const aEle = document.createElement("a");
        aEle.setAttribute("href", `#subway/${subway.name}`);
        const textEle = document.createTextNode(subway.name);
        aEle.appendChild(textEle);
        liEle.appendChild(aEle);
        ulEle.appendChild(liEle);
    });

    renderPage(ulEle);
}

function removeChildrenFromNode(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function renderSubwayPage(trainLine) {
    getStationsForTrainLine(trainLine)
        .then(a => {
            const containerEle = document.createElement("div");

            const backEle = document.createElement("a");
            backEle.setAttribute("href", `#home`);
            const backText = document.createTextNode("back");
            backEle.appendChild(backText);
            containerEle.appendChild(backEle);

            a.forEach(b => {
                const ulEle = document.createElement("ul");

                const boroughEle = document.createElement("li");
                const boroughText = document.createTextNode(b.borough);
                boroughEle.appendChild(boroughText);
                ulEle.appendChild(boroughEle);

                b.stations.forEach(station => {
                    const stationEle = document.createElement("li");
                    const aEle = document.createElement("a");
                    const stationText = document.createTextNode(station.name);
                    aEle.setAttribute("href", `#realtime/${trainLine}/${station.id}`);

                    aEle.appendChild(stationText);
                    stationEle.appendChild(aEle);
                    stationEle.setAttribute("data-station-id", station.id);
                    ulEle.appendChild(stationEle);
                });
                 
                containerEle.appendChild(ulEle);
            });

            renderPage(containerEle);
        });
}

const main = document.querySelector(".js-main");

function renderPage(page) {
    removeChildrenFromNode(main);
    main.appendChild(page);
}

function renderRealTime(trainLine, station) {
    getRealTimeForStation(trainLine, station)
        .then(a => {
            const containerEle = document.createElement("div");

            const backEle = document.createElement("a");
            backEle.setAttribute("href", `#subway/${trainLine}`);
            const backText = document.createTextNode("back");
            backEle.appendChild(backText);
            containerEle.appendChild(backEle);

            const pEle = document.createElement("p");
            const date = a.lastUpdatedTime;
            const pText = document.createTextNode(date);
            pEle.appendChild(pText);
            containerEle.appendChild(pEle);

            const directions = [a.direction1, a.direction2];
            directions.forEach(direction => {
                const ulEle = document.createElement("ul");
                const directionEle = document.createElement("li");
                const directionText = document.createTextNode(direction.name);
                directionEle.appendChild(directionText);
                ulEle.appendChild(directionEle);

                direction.times.forEach(time => {
                    const { lastStation, minutes, route } = time;
                    const timeEle = document.createElement("li");
                    const text = `${route}  ${lastStation}  ${minutes}`;
                    const timeText = document.createTextNode(text);
                    timeEle.appendChild(timeText);

                    ulEle.appendChild(timeEle);
                });

                containerEle.appendChild(ulEle);
            });

            renderPage(containerEle);
        });
}

function renderSubwayMap() {
    getSubwayMapUrl()
        .then(subwayMapUrl => {
            const objEle = document.createElement("object");
            objEle.setAttribute("width", 500);
            objEle.setAttribute("height", 375);
            objEle.setAttribute("type", "application/pdf");
            objEle.setAttribute("data", subwayMapUrl);

            renderPage(objEle);
        });
}

function getSubwayMapUrl() {
    // Need to make fetch call
    // <object> calls don't go through serviceworker cache
    // https://www.chromestatus.com/feature/6313531834105856
    // https://w3c.github.io/ServiceWorker/#implementer-concerns
    return fetch("./subway_map.pdf")
        .then(response => response.blob())
        .then(blob => {
            return URL.createObjectURL(blob);
        })
}

handleHashChange();