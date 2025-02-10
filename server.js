import {Telegraf} from 'telegraf';
import userModel from './src/models/User.js'
import connectDb from './src/config/db.js'
import { message } from 'telegraf/filters';
import eventModel from './src/models/Events.js'
import OpenAI from 'openai';


const bot = new Telegraf(process.env.BOT_TOKEN)

const client = new OpenAI({
    apiKey: process.env['OPENAI_KEY'], 
  });
  


try{
    connectDb();
    console.log("Database connected")

}catch(err){
    console.log(err)
    process.kill(process.pid, 'SIGTERM')

}

bot.start(async(ctx)=>{

    const from = ctx.update.message.from
    console.log('from', from)

    try{
        await userModel.findOneAndUpdate({tgId:from.id},{
            $setOnInsert:{
                firstName:from.first_name,
                lastName:from.last_name,
                isBot:from.is_bot,
                username:from.username
            },
        },{upsert:true, new:true})

        await ctx.reply(`Hey! ${from.first_name}, Welcome. I will be writing highly engaging social media posts for you!!! Just keep feeding me with the events throughout the day. Let's shine on socials together`);
    }catch(err){
        console.log(err),
        await ctx.reply("Oops!, Try again!")

    }




    // console.log('ctx', ctx);

    // Store the information of user in db to track the token numbers of user for handling purposes




});

bot.help((ctx)=>{
    ctx.reply('For help, contact @noSqlAtAll')       
})

bot.command('generate', async(ctx)=>{
    const from = ctx.update.message.from

    const {message_id:waitingMessageId} = await ctx.reply(`Hey!!${from.first_name}, kindly wait for a moment. I am curating posts for you`)
    const{message_id:LoadingStickerMsgId} = await ctx.replyWithSticker('CAACAgIAAxkBAAM-Z6ndO62DbxPsCBvgeCeW1yxh8gADBgEAAladvQpU6_CTffOW6zYE',)
    console.log('messageId', waitingMessageId)



    const startOfDay = new Date()
    startOfDay.setHours(0,0,0,0)

    
    const endOfDay = new Date()
    endOfDay.setHours(23,59,59,999)



    const events = eventModel.find({
        tg_Id:from.id,
        createdAt:{
            $gte:startOfDay,
            $lte:endOfDay

        }
    })
    if(events.length ===0){
        
        await ctx.deleteMessage(waitingMessageId)
        await ctx.deleteMessage(LoadingStickerMsgId)
        await ctx.reply("No events for the day")
        return
    }
    



    try{

        const chatCompletion = await OpenAI.chat.completions.create({
            messages:[
                {
                    role:'system',
                    content:`Act as a copywriter, you write highly engaging posts for linkedin, facebook and twitter using  provided thoughts/events throughout the day`
                },
                {
                    role:'user',
                    content:`Write like a human,for humans, Craft three engaging social media posts tailored for LinkedIn, Facebook, and Twitter audiences. Use simple language. Use given time tables just to understand the order of the event, don't mention the time in posts.Each post should creatively highlight the following events. Ensure the tone is conversational and impacful. Focus on engaging the respective platform's audience, encouraging  and driving interest in the events:
                    ${events.map((event)=>event.text).join(', ')}`

                }
            ],
            model:process.env.OPENAI_MODEL
        })
        

        await userModel.findOneAndUpdate({
            tg_Id:from.id,
        },{
            $inc:{
                promptTokens:chatCompletion.usage.prompt.prompt_tokens,
                completionTokens:chatCompletion.usage.completion_tokens
            }
        })
        await ctx.deleteMessage(LoadingStickerMsgId)
        await ctx.deleteMessage(waitingMessageId)
        await ctx.reply(chatCompletion.choices[0].message.content)
    }catch(err){
        console.log(err)

        await ctx.reply("Facing difficulties...")
    }


})

// bot.on(message('sticker'),(ctx)=>{
//     console.log(ctx.update.message)
// })


bot.on(message('text'), async (ctx)=>{
        const from = ctx.update.message.from
        const message = ctx.update.message.text

        try{
            await eventModel.create({
                text:message,
                tg_Id:from.id
            
            },
        )
        await ctx.reply("Noted! Keep texting me your thoughts. To generate the posts, just enter the command /generate")

        }catch(err){
            console.log(err)
            await ctx.reply("Facing issues, please try again later")

        }

    })



bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))