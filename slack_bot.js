/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
Botkitの説明は省略しました
    -> http://howdy.ai/botkit

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


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//会話関連
//
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


//会話モジュールの読み込み
var tolk_help = require('./talk/help.js');
tolk_help(controller);

var tolk_calender = require('./talk/calender.js');
tolk_calender(controller,bot);

var tolk_sample = require('./talk/sample.js');
tolk_sample(controller);




