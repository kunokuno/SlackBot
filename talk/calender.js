//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//テスト用ソース googleカレンダー用の会話
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
module.exports = function (controller,bot) {
	
    //http://www.yoheim.net/blog.php?q=20150101
    var api = require(__dirname+'/../lib/googleCalender_api.js');

//googleカレンダーから予定を持ってくる(現在時刻より先の予定)
controller.hears(['list'], 'direct_message,direct_mention,mention', function(bot, message) {
    
    //こんな状態とか分割する意味あるのか不明
    api.list(bot,message);

});

//googleカレンダーにゴミ捨ての予定を追加(現在時刻より先の予定)
controller.hears(['trash (.*) (.*)','ゴミ捨て (.*) (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    api.trash(bot,message);

});




//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//定期的に実行する
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//定期的なタスクの実行
//npm install node-cron　から.
var cron = require('node-cron');
var fs = require('fs');

//リマインドを行うSlackのチャンネルID
var remindId = '';

//channnelIDの確認　　
controller.hears(['remind'], 'direct_message,direct_mention,mention', function(bot, message) {
        bot.reply(message, 'リマインダを行うチャンネルをこのチャンネルに設定しました.');
        remindId=message.channel;
});


//当日のゴミ捨ての予定があればリマインド
//2,5
var remindTask_1 = cron.schedule('0 00 8 * * *', () =>  {
    
    bot.say({
            text: '本日の予定をお知らせします.',
            channel: remindId
    });

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        api.gomi_call(bot,remindId);
        
    });    

});

//1,4
//翌日のゴミ捨ての予定があればリマインド
var remindTask_2 = cron.schedule('0 00 18 * * *',() =>  {

    bot.say({
            text: '明日の予定をお知らせします.',
            channel: remindId
    });

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        api.gomi_call(bot,remindId);
    });

});

//taskの開始
remindTask_1.start();
remindTask_2.start();

//再起動時にtaskを再登録　
controller.on('rtm_close', function(bot, err) {
        remindTask_1.start();
        remindTask_2.start();
});


};//end module.exports
