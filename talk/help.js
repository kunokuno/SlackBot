//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//コマンドのヘルプ
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
module.exports = function (controller) {
	
   controller.hears(['help'], 'direct_message,direct_mention,mention', function(bot, message) {
        bot.say({
            text: '`[calender list]`:設定した予定を表示します(調整中)',
            channel: message.channel
        });
        bot.say({
            text: '`[set (@名前) (日付)]`:調整中',
            channel: message.channel
        });
        bot.say({
            text: '`[trash/ゴミ捨て/ゴミ捨て (@名前) (日付)]`:ゴミ捨ての予定を登録,`trash @hoge 12-01`)',
            channel: message.channel
        });
        bot.say({
            text: '`[semi/ゼミ]`:ゼミの一覧を表示',
            channel: message.channel
        });

        bot.say({
            text: '`[member add (登録名) (@名前)]`:メンバー登録\n'+
            '`[member delete (@名前)]`:メンバー削除\n'+
            '[member list]:メンバーのリストを表示(調整中)',
            channel: message.channel
        }); 




	});
       /*bot.say({
        text: 'ごめんなさい.この会話はまだ調整中です...',
        channel: message.channel
    });
    */

    //bot.reply(message, '調整中');

};