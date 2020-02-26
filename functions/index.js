
'use strict'

const express = require('express');//used to handle http requests
const morgan = require('morgan');//logs info on express
var fs = require('fs');//file system 
const http = require('http');
const bodyParser = require("body-parser");//parse json data sent over
const fetch =require('node-fetch');
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const app = express();
const handlebars = require('express-handlebars').create({});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');  

app.use(morgan('dev'));
app.use((req, res, next) => {
    console.log(`Method: ${req.method} URL: ${req.url}`);
    next();
});
app.use(express.static('public'));

//used to parse json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
  
    return month + '/' + day + '/' + year;
}


app.get('/timestamp', (request, response) => {
    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    response.send(`${Date.now()}`)
});

app.get('/weather', async(req, res) =>  {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    //const info = req.params.info.split(',');
    const latitude=req.query.latitude;
    const longitude=req.query.longitude;
    const startDate=req.query.startDate;
    const endDate=req.query.endDate;
    var end = new Date(endDate);
    var start = new Date(startDate);
    end.setDate(end.getDate());
    start.setDate(start.getDate()+1);

    var table = [];

    for (var d = start; d <= end; d.setDate(d.getDate() + 1)) {
        let unixTime=(Date.parse(d)/1000).toFixed(0);
        let api_url = `https://api.darksky.net/forecast/962f9f1ccd5336cd50b31fe2f5394792/${latitude},${longitude},${unixTime}`
        let fetch_response = await fetch(api_url);
        let json = await fetch_response.json();//holds json data
        let daily = json.daily.data[0];
        let avgTemp=((daily.temperatureLow+daily.temperatureHigh)/2);
        let adjustedPressure=(daily.pressure/33.864);
        let upDate=getFormattedDate(d);
        let adjustedHumidity=(daily.humidity*100);
        let dayStats = {
            "Icon" : daily.icon,
            "Date": upDate,
            "TempLow" :daily.temperatureLow,
            "TempHi" : daily.temperatureHigh,
            "TempAv" : avgTemp,
            "DewPt" : daily.dewPoint,
            "Humidity": adjustedHumidity,
            "Precipo": daily.precipIntensity,
            "Pressure": adjustedPressure,
            "Ozone": daily.ozone,
            "UV Index": daily.uvIndex,
            "Visibility": daily.visibility,
            "Wind Speed": daily.windSpeed,
            "wind Bearing": daily.windBearing
        };
        console.log(dayStats); 
        table.push(dayStats);
        lastData=json;
    }
    var lastData = {
        "dailyList" : table   
    };//returned as a response

    res.json(lastData);
    //res.send('what what')
});

exports.app = functions.https.onRequest(app);