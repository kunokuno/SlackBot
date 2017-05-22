//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//テスト用ソース googleカレンダー用の会話
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
module.exports = function (controller,bot) {
	
    //http://www.yoheim.net/blog.php?q=20150101
    var api = require(__dirname+'/../lib/googleCalender_api.js');

//googleカレンダーから予定を持ってくる(現在時刻より先の予定)
controller.hears(['calender list'], 'direct_message,direct_mention,mention', function(bot, message) {
    
    //こんな状態とか分割する意味あるのか不明
    api.list(bot,message);

});

//メンバーの名前登録
// Slackに打ち込まれたメンション付きの名前を
//      Googleカレンダーに書き込もうとするとSlackが管理してるメンションのIDが書き込まれる。。。
//　しょうがないのでJSONで管理
//　入力されたメンションをそのまま名前(文字列)で受け取る方法を探すべき

var nameList_file = __dirname+'/../json/namelist.json';

controller.hears(['member add (.*) <(.*)>'], 'direct_message,direct_mention,mention', function(bot, message) {

    var nameList = JSON.parse(fs.readFileSync( nameList_file , 'utf8')|| "null");
    

    var matchData = nameList.member.filter(function(item,index){
                            if(item.slackId == message.match[2]){return true;}
                        });
   console.log("****************************\nmatchData\n");
   console.log(matchData);
    if(matchData[0]){
        bot.reply(message,'そのメンバーはすでに登録されていますよ？');

    }else{
        var addData = { name : message.match[1] , slackId : message.match[2] };
        console.log("*****addData*****");
        console.log(addData);
        nameList.member.push(addData);
        fs.writeFile(nameList_file, JSON.stringify(nameList, null, '    '));
        bot.reply(message,'メンバーを登録しました');
    }

});

controller.hears(['member delete <(.*)>'], 'direct_message,direct_mention,mention', function(bot, message) {

	var nameList = JSON.parse(fs.readFileSync( nameList_file , 'utf8')|| "null");

	var deletedData = nameList.member.filter(function(item,index){
                            if(item.slackId == message.match[1]){return true;}
                        });
	//console.log(deletedData);
	if(deletedData[0]){
		nameList.member.pop(deletedData);
		fs.writeFile(nameList_file, JSON.stringify( nameList, null, '    '));
       	bot.reply(message,'メンバーを削除しました');
	}else{
		bot.reply(message,'そのメンバーは登録されていませんよ？');	
	}


});

//memberのリストを表示
controller.hears(['member list'], 'direct_message,direct_mention,mention', function(bot, message) {

    var nameList = JSON.parse(fs.readFileSync( nameList_file , 'utf8')|| "null");
    var member_list = "";

    nameList.member.forEach(function(item){
        member_list += item.name + " : " + item.slackId + "\n";
    });

    var aa = "========";
    bot.reply(message,'メンバーのリストです' + '\n'+ aa +'\n'+ member_list + '\n' + aa);

});



//テスト用
controller.hears(['t (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    console.log('++++++++++++');
    console.log(message);
    console.log('++++++++++++');
    bot.reply(message,'<!secretary>');
    bot.reply(message,'メッセージテスト'+message.match[1]+message.match[1].slice(1));

});

//googleカレンダーから予定を持ってきたいけど
//とりあえず
controller.hears(['semi','ゼミ'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message,'ゼミの予定は以下のようになっています。'+
                    '火曜日 14:30～16:30頃\n'+
                    '5月16日　薄井(1)　久野(1)　長岡(1)\n'+
                    '5月30日　中山(1)　山岸(1)　遊佐(1)\n'+
                    '6月13日　薄井(2)　久野(2)　長岡(2)\n'+
                    '6月27日　中山(2)　山岸(2)　遊佐(2)\n'+
                    '7月11日　薄井(3)　久野(3)　長岡(3)\n'+
                    '7月25日　中山(3)　山岸(3)　遊佐(3)\n'+
                    '金曜日 9:00～10:00頃\n'+
                    '5月12日　田代(1)\n'+
                    '5月19日　岡田(1)\n'+
                    '5月26日　築地(1)\n'+
                    '6月02日　田代(2)\n'+
                    '6月09日　岡田(2)\n'+
                    '6月16日　築地(2)\n'+
                    '6月23日　田代(3)\n'+
                    '6月30日　岡田(3)\n'+
                    '7月07日　築地(3)\n'+
                    '7月14日　田代(4)\n'+
                    '7月21日　岡田(4)\n'+
                    '7月28日　築地(4)\n');
});      




//googleカレンダーにゴミ捨ての予定を追加(現在時刻より先の予定)
controller.hears(['trash <(.*)> (.*)','ゴミ捨て <(.*)> (.*)','ごみ捨て <(.*)> (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
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
var remindTask_1 = cron.schedule('0 0 8 * * 2,5', () =>  {
    
    bot.say({
            text: '本日の予定をお知らせします.',
            channel: remindId
    });
    
    api.gomi_call(bot,remindId);  

});

//翌日のゴミ捨ての予定があればリマインド
var remindTask_2 = cron.schedule('0 0 18 * * 1,4',() =>  {

    bot.say({
            text: '明日の予定をお知らせします.',
            channel: remindId
    });

    api.gomi_call(bot,remindId);

});

/*
var testTask = cron.schedule('* * * * * *',() =>  {
    console.log("botlog:**schedule_call**");
});
*/

//cronがどのタイミングで切れるのか不明
//これいらない説
/*controller.on('rtm_start', function(bot, err) {
        console.log("botlog:set remind task");
        remindTask_1.start();
        remindTask_2.start();
        //testTask.start();
});
*/

//cronの動作確認　　
controller.hears(['cron'], 'direct_message,direct_mention,mention', function(bot, message) {
        bot.reply(message, remindTask_1.tick+" : "+remindTask_2.tick);
        console.log("*******remindTask_1*******");
        console.log(remindTask_1);
        console.log("*******remindTask_2*******");
        console.log(remindTask_2);
});


};//end module.exports
