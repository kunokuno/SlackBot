/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
Botkitの説明は省略しました
    -> http://howdy.ai/botkit

ソース内容
 - 設定
 - Google API
 - Botの会話 

使い方
 - quickstart.jsを実行して表示されたURLから対象のカレンダーを持つGoogleアカウントでログイン
 　IDをコンソールにコピペ
 - 対象のSlackでBotのトークンを作成
　　すぐ下のソースに貼り付け

タスク
 - ゴミの予定をSlackでなんやかんやするだけ

最終更新:2017/2/17
Var 1.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//
// 設定関係
//
//
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//日付取得　 
//npm install date-utils から.
require('date-utils');
var dt = new Date();
//定期的なタスクの実行
//npm install node-cron　から.
var cron = require('node-cron');

//トークンとか読み込み
var fs = require('fs');
var token = JSON.parse(fs.readFileSync("id.json", "utf-8"));

  //https://my.slack.com/services/new/bot　でSlack側のBot設定
  //id.jsonにBotトークンを書く xoxbなんとか
  process.env.token=token.process_env_token;
  if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
  }

//登録,参照するカレンダーのID
var gomi_calendar_id = token.gomi_calender_id;

//リマインドを行うSlackのチャンネルID
var remindId = '';


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//
// 初期設定
//
//
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//Botkitの設定
var Botkit = require('./botkit/lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();


//GoogleAPIを使うための設定
var fs = require('fs');
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

///////////////////////////////////////
///GoogleAPI連携関連(コピペ)
///////////////////////////////////////

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, message) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client,message);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
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
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
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

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
//
// googleAPI 用のfunction
//

function listEvents(auth,message) {
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
      bot.say({
            text: 'mainカレンダーに予定は無いようです',
            channel: remindId
        });
    } else {
      console.log('Upcoming 10 events:');
      bot.reply(message, '[日程] -------------------------------- [タスク名] ----[内容]');
      for (i = 0; i < events.length; i++) {
        var eventStart = events[i].start.dateTime || events[i].start.date;
        bot.reply(message, eventStart+ '---' +events[i].summary+'---'+events[i].description);
      }
    }
  });
}


var year;
function setGarbageEvents(auth,message){

 //年の取得
 year = dt.toFormat("YYYY");

 //イベント内容のJsonは別に描きたい
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

//リマインド用 ゴミ捨ての予定があるか確認
function checkGarbageEvents(auth,a){
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


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//会話関連
//
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//初めからあった会話(放置)

controller.hears(['hello', 'hi','おはよう'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'heart',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'こんにちは ' + user.name + 'さん!!');
        } else {
            bot.reply(message, 'こんにちは!');
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':heart: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}






//ここから追加した会話

controller.hears(['help'], 'direct_message,direct_mention,mention', function(bot, message) {
        bot.say({
            text: '`[list]`:設定した予定を表示します',
            channel: message.channel
        });
        bot.say({
            text: '`[set (@名前) (日付)]`:調整中',
            channel: message.channel
        });
        bot.say({
            text: '`[trash (@名前) (日付:例12-01)]`:ゴミ捨ての予定を登録',
            channel: message.channel
        });
});


//googleカレンダーから予定を持ってくる(現在時刻より先の予定)
controller.hears(['list'], 'direct_message,direct_mention,mention', function(bot, message) {


            bot.say({
                text: 'ごめんなさい.この会話はまだ調整中です...',
                channel: message.channel
            });

            /*
            fs.readFile('client_secret.json', function processClientSecrets(err, content) {
            if (err) {
            console.log('Error loading client secret file: ' + err);
                return;
            }
            bot.reply(message, '予定の一覧を表示しますね(時刻の表示がひどいのはごめんなさい)');
            // Authorize a client with the loaded credentials, then call the
            // Google Calendar API.
            authorize(JSON.parse(content), listEvents,message);
            authorize(JSON.parse(content), checkGarbageEvents,message);
            });
            */

});


//channnelIDの確認
controller.hears(['remind'], 'direct_message,direct_mention,mention', function(bot, message) {
        bot.reply(message, 'リマインダを行うチャンネルをこのチャンネルに設定しました.');
        remindId=message.channel;
});


//カレンダーに予定を追加
controller.hears(['set (.*) (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
        bot.say({
            text: 'ごめんなさい.この会話はまだ調整中です...',
            channel: message.channel
        });
});

//カレンダーに予定を追加[ゴミ専用]
controller.hears(['trash (.*) (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
                return;
        }
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    authorize(JSON.parse(content), setGarbageEvents,message);
    });

});



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//定期的に実行する
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//当日のゴミ捨ての予定があればリマインド
cron.schedule('0 0 8 * * *', () => {
    
    bot.say({
            text: '本日の予定をお知らせします.',
            channel: remindId
    });

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Calendar API.
        authorize(JSON.parse(content), checkGarbageEvents, null);
    });    

});


//翌日のゴミ捨ての予定があればリマインド
cron.schedule('0 0 18 * * *',() =>  {

    bot.say({
            text: '明日の予定をお知らせします.',
            channel: remindId
    });

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Calendar API.
        authorize(JSON.parse(content), checkGarbageEvents,null);
    });

});
