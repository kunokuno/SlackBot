//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//コマンドのヘルプ
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
module.exports = function (controller) {
	
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
            text: '`[trash/ゴミ捨て (@名前) (日付)]`:ゴミ捨ての予定を登録,`trash @hoge 12-01`)',
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