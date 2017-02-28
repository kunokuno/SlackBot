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
            text: '`[trash (@名前) (日付:例12-01)]`:ゴミ捨ての予定を登録',
            channel: message.channel
        });





	});

};