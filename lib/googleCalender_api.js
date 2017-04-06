
//Gogoleカレンダーに関するAPIだけを切り分けたい


//登録,参照するカレンダーのID
var fs = require('fs');
//ID(というかパス)の管理がめちゃくちゃだから綺麗にしたい
var token = JSON.parse(fs.readFileSync(__dirname+"/../id.json", "utf-8"));
var gomi_calendar_id = token.gomi_calender_id;


//GoogleAPIを使うための設定

var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var calendar = google.calendar('v3');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'google-calendar-nodejs-tokenpath.json';

var i;//汎用


function authorize (credentials, callback, bot, message) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback, bot, message);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, bot, message);
    }
  });
}

//
//GoogleAPIのAuthorizeが使うfunction
//
function getNewToken (oauth2Client, callback, bot, message) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, bot, message);
    });
  });
}

function storeToken (token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}


















//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// googleAPI を使った実際のfunction
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

 function listEvents (auth, bot, message) {
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length === 0) {
        console.log('No events:');
        bot.reply(message, '予定はないようです');
        return;
    } else {
      console.log('Upcoming 10 events:');
      console.log(events);

      bot.reply(message, '[日程] -------------------------------- [タスク名] ----[内容]');
      for (i = 0; i < events.length; i++) {
        var eventStart = events[i].start.dateTime || events[i].start.date;
        bot.reply(message, eventStart+ '---' +events[i].summary+'---'+events[i].description);
      }
      
    }
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

 function setGarbageEvents (auth,bot,message){

 //とりあえず年だけは事前に取得
 //日付取得　 
 //npm install date-utils から.
 require('date-utils');
 var dt = new Date();
 var year = dt.toFormat("YYYY");

 //ごみ捨て用のイベントJSON
  var event = {
  'summary': 'ゴミ捨て',
  'location': '',
  'description': message.match[1],
  'start': {
    'dateTime': year+'-'+message.match[2]+'T08:00:00+09:00',
    'timeZone': 'Asia/Tokyo',
  },
  'end': {
    'dateTime': year+'-'+message.match[2]+'T09:00:00+09:00',
    'timeZone': 'Asia/Tokyo',
  },
  //'recurrence': [
  //  'RRULE:FREQ=DAILY;COUNT=2'//繰り返し予定とかをまとめて設定するやつ
  //],
  //'attendees': [
  //  {'email': 'sbrin@example.com'},//たぶんここにメールが行く
  //],
  'reminders': {
    'useDefault': false,
    'overrides': false,
    //ポップアップ(Googleのカレンダーページでの)・・・いらない説
    //'overrides': [{'method': 'popup', 'minutes': 10},],
  },
  };
  calendar.events.insert({
    auth: auth,
    calendarId: gomi_calendar_id,
    resource: event,
  }, function(err, event) {
    if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
  console.log('Event created: %s', event.htmlLink);
  bot.reply(message, 'ゴミ捨ての予定を登録いたしました.');
  });

}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

//リマインド用 ゴミ捨ての予定があるか確認
 function checkGarbageEvents(auth, bot, remindId){
    calendar.events.list({
    auth: auth,
    calendarId: gomi_calendar_id,
    timeMin: (new Date()).toISOString(),
    maxResults: 1,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (response.items.length === 0) {
        bot.say({
            text: 'ゴミ捨ての予定は無いようです',
            channel: remindId
        });
    } else {  
        console.log('Upcoming events:');
        var eventStart = events[0].start.dateTime;
        bot.say({
            text: events[0].start.dateTime+' --- '+events[0].summary + ' --- 担当者:'+events[0].description,
            channel: remindId
        });
        
    }
  });

}



















//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//テスト用ソース　外部呼び出し用
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var api = {};
api.list = function(bot,message) {
  
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    authorize(JSON.parse(content), listEvents, bot, message);
  });


};
api.trash = function(bot,message) {
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    authorize(JSON.parse(content), setGarbageEvents, bot, message);
  });

};



api.gomi_call = function(bot,remindId){
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    authorize(JSON.parse(content), checkGarbageEvents, bot, remindId);
  });
};
module.exports = api;

