const MIN_PATH_DISTANCE = 2;

const ICON_HOUSE = L.icon({
    iconUrl: '/res/home_marker.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
});

const ICON_BURST = L.icon({
    iconUrl: '/res/explosion_marker.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, 0]
});

const ICON_LOC_RED = L.icon({
    iconUrl: '/res/red_marker.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
});

let map = L.map('map').setView([51.483667, -113.142667], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.control.scale().addTo(map);

function getDistanceBetweenCoords(coord1, coord2) {
    let radius = 6371 * 1000; // Earth's radius in meters
    let lat1 = coord1[0] * Math.PI/180;
    let lon1 = coord1[1] * Math.PI/180;
    let lat2 = coord2[0] * Math.PI/180;
    let lon2 = coord2[1] * Math.PI/180;
    let sinLat = Math.pow(Math.sin((lat2 - lat1)/2), 2)
    let sinLon = Math.pow(Math.sin((lon2 - lon1)/2), 2)
    let cosScaling = Math.cos(lat1) * Math.cos(lat2);
    let sqrtTerm = Math.sqrt(sinLat + cosScaling*sinLon);
    return 2 * radius * Math.asin(sqrtTerm);
}

function plotLine(coords1, coords2, colour) {
    if (coords1 != coords2) {
        L.polyline([coords1, coords2], {
            color: colour,
            smoothFactor: 2.0,
            weight: 1.5
        }).addTo(map);
    }
}

function plotMarker(location, altitude, time, title, icon) {
    let getRoute = "Get Route";
    // How to format the maps query: https://developers.google.com/maps/documentation/urls/get-started
    let mapsQuery = "https://google.ca/maps/dir/?api=1&destination=" + location[0] + "," + location[1]
    let mapsLink = getRoute.link(mapsQuery);
    let marker;
    if (icon == null) {
        marker = L.marker(location).addTo(map);
    } else {
        marker = L.marker(location, {icon: icon}).addTo(map);
    }
    let distFromLaunch = (getDistanceBetweenCoords([51.484017, -113.142683], location) / 1000).toFixed(2);
    marker.bindPopup("<p><b>"+ title + "</b><br>"
                     + "Time: " + time + " UTC<br>"
                     + "Distance from launch site: " + distFromLaunch + "km<br>"
                     + "Altitude: " + altitude + "m" + "<br></p>");
    return marker;
}

let prevPathLoc = null;
async function plotPath() {
    let response = await fetch('/res/data_full.csv');
    let data = await response.text();
    let lineData = data.split('\n');

    for (let i = 0; i < lineData.length; i++) {
        let telemetry = lineData[i].split(',');
        if (prevPathLoc == null) {
            prevPathLoc = [telemetry[0], telemetry[1], telemetry[2]]; // [lat, lng, alt]

        } else if (getDistanceBetweenCoords([prevPathLoc[0], prevPathLoc[1]], [telemetry[0], telemetry[1]]) >= MIN_PATH_DISTANCE) {
            let colour = 'blue';
            if (telemetry[2] - prevPathLoc[2] >= 0) {
                colour = 'lime';
            } else {
                colour = 'red';
            }
            plotLine([prevPathLoc[0], prevPathLoc[1]], [telemetry[0], telemetry[1]], colour);
            prevPathLoc = [telemetry[0], telemetry[1], telemetry[2]];
        }

    }
}

function plotMilestones() {
    let launchData = [51.484017, -113.142683, 772.3, "13:42:11"];
    let burstData = [51.105433, -112.797983, 34340.1,"15:56:14"];
    let landingData = [50.903080, -112.606890, 845.0, "16:42:50"];
    plotMarker([launchData[0], launchData[1]], launchData[2], launchData[3], "Launch Site", ICON_HOUSE);
    plotMarker([burstData[0], burstData[1]], burstData[2], burstData[3], "Burst", ICON_BURST);
    plotMarker([landingData[0], landingData[1]], landingData[2], landingData[3], "Landing Site", ICON_LOC_RED);
}

plotPath();
plotMilestones();