require('dotenv').config();
const apiKey = process.env.OPENAI_API_KEY;

function Backtest() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth() + 1;
    let currentDay = currentDate.getDate();
    let current_Time = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();

    console.log("Test Manual Backtest " + current_Time + " of " + currentMonth + "/" + currentDay );
    CurrentBacktest()
}
Backtest();


let tokken =
  "eyJhbGciOiAiUlMyNTYiLCAidHlwIjogIkpXVCIsICJraWQiOiAiMTFhYzc0MGYxZjBiYmY5YzAwM2YwOGJlMWEwZGExNDU1MGIzYjQ5YyJ9.eyJpc3MiOiAiZmlyZWJhc2UtYWRtaW5zZGstemEyM2dAa3ViZXItZmY0MzkuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCAic3ViIjogImZpcmViYXNlLWFkbWluc2RrLXphMjNnQGt1YmVyLWZmNDM5LmlhbS5nc2VydmljZWFjY291bnQuY29tIiwgImF1ZCI6ICJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsICJ1aWQiOiAiYXNoaXNoQHNvY2lhbGt5dGUuY29tIiwgImlhdCI6IDE3NDczOTIwNDAsICJleHAiOiAxNzQ3Mzk1NjQwfQ.L0drVGBI2AskxTXitktJ_FwtVQoqwu1YE5yqYgOI1YmEsYCaR7npbOYzfONYARieJFkb1fZhveB0xnF0AaBcfRG080f1itBV5vkhzkL6sY9eNmV1xIb0iDRp3PqCocZo8VQB3CmpP_eTw40kethpYEX-dlR02CmHq0o0ZBTxKHHYIGHxYN7Yj1klnsvSbkxYjW-exlB_1QlXf9yFi215B_n9CvOsYcXJ9GREoaooS8o1Z43j0TMqKwydD8JJ3p2KsZvkiOCMSp28RDjv2-FqZAfl5d3OyRqY6oKQc4PrvZ0-BVv8oIcQ7Xt9FsJw44Q8x47b9MboZxg3JqFL_6QiqA";

async function CurrentBacktest() {
  let ApplicableDates = await FetchBacktestRanges();
  let dates = [];
  Object.keys(ApplicableDates).forEach(function (key) {
    dates.push(key);
  });
  for (let i in dates) {
    let strikeData = await GetStrikesData(dates[i]);
    let TodaysData = await FetchWholeCombined(
      dates[i],
      ApplicableDates[dates[i]].current_expiry,
      ApplicableDates[dates[i]].today_min,
      ApplicableDates[dates[i]].today_max
    );
    let Strikesdata = {};
    Object.keys(TodaysData).forEach(function (key) {
      for (let j in strikeData) {
        if (strikeData[j].id == key) {
          Strikesdata[strikeData[j].strike_price] = TodaysData[key];
        }
      }
    });
    let underlying = 0;
    strikeData.map((item) => {
      if (Strikesdata[item.strike_price][0].underlying != "0") {
        underlying = parseInt(Strikesdata[item.strike_price][0].underlying);
      }
    });

    let middlekey =
      Object.keys(Strikesdata)[Math.floor(Object.keys(Strikesdata).length / 2)];
    let currentSpot = Math.round(underlying / 50) * 50;

    console.log(dates[i] + "Started");

    let start = currentSpot - 500;
    let end = currentSpot + 500;
    let MinSupport = 999999;
    let MaxResistance = 0;

    let GOGATrades = [];
    let GOGALITETrades = [];
    let GOGAPHADITrades = [];
    let GOGACHARLIETrades = [];
    let UploadJson = [];

    let MaxDrawGoga = 0;
    let MaxDrawGogaLite = 0;
    let MaxDrawGogaPhadi = 0;
    let MaxDrawGogaCharlie = 0;

    let GogaPnl = 0;
    let GogaLitePnl = 0;
    let GogaPhadiPnl = 0;
    let GogaCharliePnl = 0;

    for (let i = 1; i < 370; i++) {
      let currentUnderlying = parseInt(Strikesdata[middlekey][i].underlying);
      let Current_Statement = `Nifty spot is at ${currentUnderlying} and time is ${Strikesdata[middlekey][i].time} \n `;
      Object.keys(Strikesdata).forEach(function (key) {
        if (key >= start && key <= end) {
          let currentValue = Strikesdata[key][i];
          Current_Statement += `At strike ${key}, PE price is ${Math.round(
            currentValue?.closepe
          )}, buy quantity PE is ${Math.round(
            currentValue?.buyqtype
          )} and sell quantity PE is ${Math.round(
            currentValue?.sellqtype
          )}. While CE price is ${Math.round(
            currentValue?.closece
          )}, buy quantity ce is ${Math.round(
            currentValue?.buyqtyce
          )} and Sell quantity CE is at ${Math.round(
            currentValue?.sellqtyce
          )}  \n  \n`;
        }
      });
      let middleValue = Strikesdata[middlekey][i];
      let hour;
      let Min;
      if (middleValue.time.includes("T")) {
        hour = middleValue.time.split("T")[1].split(":")[0];
        Min = middleValue.time.split("T")[1].split(":")[1];
      } else {
        hour = middleValue.time.split(" ")[1].split(":")[0];
        Min = middleValue.time.split(" ")[1].split(":")[1];
      }
      if (
        (Min == "00" || Min == "15" || Min == "30" || Min == "45") &&
        hour != "9" &&
        hour != "45"
      ) {
        let GPTData;
        let response = await FetchGptStatementfromDB(middleValue.time);
        if ( response?.[0].data != undefined) {
            GPTData = response[0].data
        }else{
            GPTData = await FetchFromGPT(Current_Statement);
        }

        // GOGA
        let support = Math.round(GPTData?.Support / 50) * 50;
        let resistance = Math.round(GPTData?.Resistance / 50) * 50;
        let supportPrices = {
          Call_Price: Strikesdata[support]?.[i].closece,
          Put_Price: Strikesdata[support]?.[i].closepe,
        };
        let ResistancePrices = {
          Call_Price: Strikesdata[resistance][i].closece,
          Put_Price: Strikesdata[resistance][i].closepe,
        };

        GOGATrades.push({
          time: Strikesdata[middlekey][i].time,
          Support: support,
          Resistance: resistance,
          SupportPrices: supportPrices,
          ResistancePrices: ResistancePrices,
        });

        // GOGA LITE

        let supportLite
        let ResistanceLite
        if(Strikesdata[ support - 100]){ 
           supportLite = support - 100;
        }else{
           supportLite = support
        }

        if(Strikesdata[ resistance + 100]){
          ResistanceLite = resistance + 100;
        }else{
          ResistanceLite = resistance
        }


        let supportLitePrices ={
          Call_Price: Strikesdata[supportLite][i].closece,
          Put_Price: Strikesdata[supportLite][i].closepe,
        };
        let ResistanceLitePrices =  {
          Call_Price: Strikesdata[ResistanceLite][i].closece,
          Put_Price: Strikesdata[ResistanceLite][i].closepe,
        };

        GOGALITETrades.push({
          time: Strikesdata[middlekey][i].time,
          Support: supportLite,
          Resistance: ResistanceLite,
          SupportPrices: supportLitePrices,
          ResistancePrices: ResistanceLitePrices,
        });

        // GOGA PAHADI
        let Supportbuyqtype = 0;
        let Supportsellqtype = 0;
        let Supportbuyqtyce = 0;
        let Supportsellqtyce = 0;

        let Resistancebuyqtype = 0;
        let Resistancesellqtype = 0;
        let Resistancebuyqtyce = 0;
        let Resistancesellqtyce = 0;

        Object.keys(Strikesdata).forEach(function (key) {
          if (key >= support - 100 && key <= support) {
            if (Strikesdata[key][i].buyqtype) {
              Supportbuyqtype += parseInt(Strikesdata[key][i].buyqtype);
            }
            if (Strikesdata[key][i].sellqtype) {
              Supportsellqtype += parseInt(Strikesdata[key][i].sellqtype);
            }
            if (Strikesdata[key][i].buyqtyce) {
              Supportbuyqtyce += parseInt(Strikesdata[key][i].buyqtyce);
            }
            if (Strikesdata[key][i].sellqtyce) {
              Supportsellqtyce += parseInt(Strikesdata[key][i].sellqtyce);
            }
          }
          if (key >= resistance && key <= resistance + 100) {
            if (Strikesdata[key][i].buyqtype) {
              Resistancebuyqtype += parseInt(Strikesdata[key][i].buyqtype);
            }
            if (Strikesdata[key][i].sellqtype) {
              Resistancesellqtype += parseInt(Strikesdata[key][i].sellqtype);
            }
            if (Strikesdata[key][i].buyqtyce) {
              Resistancebuyqtyce += parseInt(Strikesdata[key][i].buyqtyce);
            }
            if (Strikesdata[key][i].sellqtyce) {
              Resistancesellqtyce += parseInt(Strikesdata[key][i].sellqtyce);
            }
          }
        });

        let supportBlastpe =
          Supportbuyqtype /
          Supportsellqtype /
          (Supportbuyqtyce / Supportsellqtyce);

        let supportBlastce =
          Supportbuyqtyce /
          Supportsellqtyce /
          (Supportbuyqtype / Supportsellqtype);

        let resistanceBlastpe =
          Resistancebuyqtype /
          Resistancesellqtype /
          (Resistancebuyqtyce / Resistancesellqtyce);

        let resistanceBlastce =
          Resistancebuyqtyce /
          Resistancesellqtyce /
          (Resistancebuyqtype / Resistancesellqtype);

        if (supportBlastce - supportBlastpe > 1) {
          // take trade
        }

        if (resistanceBlastpe - resistanceBlastce > 1) {
          // take trade
        }

        GOGAPHADITrades.push({
          time: Strikesdata[middlekey][i].time,
          Support: support,
          Resistance: resistance,
          SupportPrices:
            supportBlastce - supportBlastpe > 1 ? supportPrices : 0,
          ResistancePrices:
            resistanceBlastpe - resistanceBlastce > 1 ? ResistancePrices : 0,
          supportBlastceTrade: supportBlastce - supportBlastpe,
          resistanceBlastceTrade: resistanceBlastpe - resistanceBlastce,
        });

        // GOGA CHARLIE

        let objectTosave = {
          Date: middleValue.time,
          data: GPTData,
          Option: "Nifty",
          blastSupport: supportBlastce - supportBlastpe,
          SupportPrices: supportPrices,
          supportBlastce: supportBlastce,
          supportBlastpe: supportBlastpe,
          ResistancePrice: ResistancePrices,
          blastResistance: resistanceBlastpe - resistanceBlastce,
          resistanceBlastce: resistanceBlastce,
          resistanceBlastpe: resistanceBlastpe,
          SupportLitePrices: supportLitePrices,
          ResistanceLitePrices: ResistanceLitePrices,
          GOGA_Charlie: {}
        };
        UploadJson.push(objectTosave);



        // GOGACHARLIETrades.push({
        //   time : middleValue.time,
        //   support: support,
        //   resistance: resistance,
        //   MinSupport: MinSupport,
        //   MaxResistance: MaxResistance,
        //   SupportPrices : {
        //     Call_Price: Strikesdata[support][i].closece,
        //     Put_Price: Strikesdata[support][i].closepe,
        //   },
        //   ResistancePrices : {
        //     Call_Price: Strikesdata[resistance][i].closece,
        //     Put_Price: Strikesdata[resistance][i].closepe,
        //   },
        //   MinSupportPrices : {
        //     Call_Price: MinSupport < 99000 ? Strikesdata[MinSupport][i].closece :0,
        //     Put_Price: MinSupport < 99000 ? Strikesdata[MinSupport][i].closepe :0,
        //   },
        //   MaxResistancePrices : {
        //     Call_Price: MaxResistance > 0 ? Strikesdata[MaxResistance][i].closece :0,
        //     Put_Price:MaxResistance > 0 ? Strikesdata[MaxResistance][i].closepe :0,
        //   },
        // })
        if (parseInt(hour) < 10 && parseInt(Min) < 46) {
          if (support < MinSupport) {
            GOGACHARLIETrades?.map((item) => {
              if (item.support > support && !item.SupportExit) {
                item.SupportExit = Strikesdata[item.support][i].closepe;
                item.SupportExitStrike = item.support;
                item.SupportExitTime = middleValue.time;
              }
            });
            GOGACHARLIETrades.push({
              time: middleValue.time,
              support: support,
              MinSupport: MinSupport,
              SupportEntry: Strikesdata[support][i].closepe,
              SupportEntyStrike: support,
              SupportEntyTime: middleValue.time,
              CurrentSupport: support,
            });
            MinSupport = support;
          } else {
            GOGACHARLIETrades.push({
              time: middleValue.time,
              support: MinSupport,
              MinSupport: MinSupport,
              SupportEntry: Strikesdata[MinSupport][i].closepe,
              SupportEntryStrike: MinSupport,
              SupportEntyTime: middleValue.time,
              CurrentSupport: support,
            });
            // take trade on minsupport
          }

          if (resistance > MaxResistance) {
            GOGACHARLIETrades?.map((item) => {
              if (item.resistance < resistance && !item.ResistanceExit) {
                item.ResistanceExit = Strikesdata[item.resistance][i].closece;
                item.ResistanceExitStrike = item.resistance;
                item.ResistanceExitTime = middleValue.time;
              }
            });
            let CurrentItem = GOGACHARLIETrades[GOGACHARLIETrades.length-1]
            CurrentItem.resistance = resistance
            CurrentItem.MaxResistance = MaxResistance
            CurrentItem.ResistanceEntry = Strikesdata[resistance][i].closece
            CurrentItem.ResistanceEntryStrike = resistance
            CurrentItem.ResistanceEntryTime = middleValue.time
            MaxResistance = resistance;
          } else {
            let CurrentItem = GOGACHARLIETrades[GOGACHARLIETrades.length-1]

            CurrentItem.resistance = MaxResistance
            CurrentItem.MaxResistance = MaxResistance
            CurrentItem.ResistanceEntry = Strikesdata[MaxResistance][i].closece
            CurrentItem.ResistanceEntryStrike = MaxResistance
            CurrentItem.ResistanceEntryTime = middleValue.time,
            CurrentItem.CurrentResistance = resistance
            // take trade on maxresistance
          }
        }
        if (parseInt(hour) == 9 && parseInt(Min) == 45) {
          GOGACHARLIETrades?.map((item) => {
            if (!item.SupportExit) {
              item.SupportExit = Strikesdata[item.support][i].closepe;
              item.SupportExitStrike = item.support;
              item.SupportExitTime = middleValue.time;
            }
            if ( !item.ResistanceExit) {
              item.ResistanceExit = Strikesdata[item.resistance][i].closece;
              item.ResistanceExitStrike = item.resistance;
              item.ResistanceExitTime = middleValue.time;
            }
          });
        }
      }

      if (parseInt(hour) < 10 && parseInt(Min) < 46) {
        let currentGOGAPNL = 0;

        GOGATrades?.map((item) => {
          let supportPNL =
            item.SupportPrices.Put_Price - Strikesdata[item.Support][i].closepe;
          let resistancePNL =
            item.ResistancePrices.Call_Price -
            Strikesdata[item.Resistance][i].closece;
          let totalCurrentPNL = supportPNL + resistancePNL;
          currentGOGAPNL += totalCurrentPNL;
        });

        let currentGOGALITEPnl = 0;
        GOGALITETrades?.map((item) => {
          let supportPNL =
            item.SupportPrices.Put_Price - Strikesdata[item.Support][i].closepe;
          let resistancePNL =
            item.ResistancePrices.Call_Price -
            Strikesdata[item.Resistance][i].closece;
          let totalCurrentPNL = supportPNL + resistancePNL;
          currentGOGALITEPnl += totalCurrentPNL;
        });

        let currentGOGAPHADIPnl = 0;
        GOGAPHADITrades?.map((item) => {
          let supportPNL =
            item.SupportPrices != 0
              ? item.SupportPrices.Put_Price -
                Strikesdata[item.Support][i].closepe
              : 0;
          let resistancePNL =
            item.ResistancePrices != 0
              ? item.ResistancePrices.Call_Price -
                Strikesdata[item.Resistance][i].closece
              : 0;
          let totalCurrentPNL = supportPNL + resistancePNL;
          currentGOGAPHADIPnl += totalCurrentPNL;
        });


        
        let currentGOGACHARLIEPnl = 0;
        GOGACHARLIETrades?.map((item) => {
          let supportPNL
          let resistancePNL
          if(!item.SupportExit){
           supportPNL = item.SupportEntry - Strikesdata[item.support][i].closepe; 
          }else{
           supportPNL = item.SupportEntry - item.SupportExit;
          }
          if(!item.ResistanceExit){
            resistancePNL = item.ResistanceEntry - Strikesdata[item.resistance][i].closece;
          }else{
            resistancePNL = item.ResistanceEntry - item.ResistanceExit;
          }
          let totalCurrentPNL = supportPNL + resistancePNL;
          currentGOGACHARLIEPnl += totalCurrentPNL;
        });



        if (currentGOGAPNL < MaxDrawGoga) {
          MaxDrawGoga = currentGOGAPNL;
        }

        if (currentGOGALITEPnl < MaxDrawGogaLite) {
          MaxDrawGogaLite = currentGOGALITEPnl;
        }

        if (currentGOGAPHADIPnl < MaxDrawGogaPhadi) {
          MaxDrawGogaPhadi = currentGOGAPHADIPnl;
        }

        if (currentGOGACHARLIEPnl < MaxDrawGogaCharlie) {
          MaxDrawGogaCharlie = currentGOGACHARLIEPnl;
        }

        if (parseInt(hour) == 9 && parseInt(Min) == 45) {
          GogaPnl = currentGOGAPNL;
          GogaLitePnl = currentGOGALITEPnl;
          GogaPhadiPnl = currentGOGAPHADIPnl;
          GogaCharliePnl = currentGOGACHARLIEPnl;
        }
      }
    }
    UploadJson.map((item,index) => {
      item.GOGA_Charlie = GOGACHARLIETrades[index]
    })
    let json = {
      Date : dates[i]+"T10:00:00",
      Goga:{
        pnl :GogaPnl,
        MaxDrawDown :MaxDrawGoga,
        NumberOfTrades : GOGATrades.length,
        Date : dates[i],
      },
      GogaLite :{
        pnl :GogaLitePnl,
        MaxDrawDown :MaxDrawGogaLite,
        NumberOfTrades : GOGALITETrades.length,
        Date : dates[i],
      },
      GogaPhadi :{
        pnl :GogaPhadiPnl,
        MaxDrawDown :MaxDrawGogaPhadi,
        NumberOfTrades : GOGAPHADITrades.length,
        Date : dates[i],
      },
      GogaCharlie :{
        pnl :GogaCharliePnl,
        MaxDrawDown :MaxDrawGogaCharlie,
        NumberOfTrades : GOGACHARLIETrades.length,
        Date : dates[i],
      },
    }
    UploadJson.push(json)
    // console.log(UploadJson);
    // UpdateToDB(json);

    UploadJson.map((item) => {
      UpdateToDB(item);
    })


    console.log(dates[i] + "Updated Successfully");

  }
}


async function UpdateToDB(json) {
  const response = await fetch(`https://tradekuber.com/set_kuber_ai_data_temp`,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokken}`,
      },
      body: JSON.stringify({
        data: json
      }),
    }
  )  
  const data = await response.json();
  console.log(data);
}

async function FetchGptStatementfromDB(time) {
  let formatedTime = time.replace("T", " ");
  const response = await fetch(
    `https://tradekuber.com/get_kuber_ai_statement`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokken}`,
      },
      body: JSON.stringify({
        current_date: formatedTime,
      }),
    }
  );
  const data = await response.json();
  return data.data[0];
}

async function FetchFromGPT(Statement) {
  let prompt = `Build Kuber AI predictive commentary for the next 2 hrs based on the data provided.   Act like an options trader with 40 years of experience and think deep.  Focus on pinning, traps, squeezes  Do not give the data out. Speak decisively as if traders are waiting for directions from you. You can even try and simplify this. start by saying “As per AI commentary", Tell them exactly which trades should be taken. If and only if, you feel it’s no time to trade, just say hands in pocket.  Remember that these are young traders who are depending on your insights. Also please tell me if options are mispriced and if yes which one and whether it is underpriced or overpriced.   Important - consider today's date, and the expiry of contracts on upcoming thursday to plan your trades. Important - Think Like Jesse Livermore but do not give out his name in the commentary. Super Important - Make predictions like your IQ is 300 but it should be simple for anyone to understand.  Get everything right Please!  Please Give exact pinning price and prices of traps. Please clearly give the support point (where i can buy) and resistance point (where i can sell) clearly. Also please please do mention for what time frame is your commentary valid. Please also give a risk warning . Do not be patronizing like “young traders now” etc. Behave professionally and give a very detailed description of everything that has been asked. Please be thorough and give it in about 4000 characters.Tell me with 100% accuracy whether the market is in mean reversion or in trending mode, based on order flow and give detailed explanation of the same             response format must be a json like this and support and resistanse should be a number only :         {         Time:         Spot:         Overall analysis of Pinning, Traps, Squeezes:         Market Prediction based on analysis:         Suggested trading strategy:         Mispriced Options:         Support:         Resistance:         TimeFrame for predicition:         Trending or MeanReversion:         riskWarning:         }         note that all value should be in string or number `;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: Statement,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 7000, // Adjust based on your needs
    }),
  });

  const data = await response.json();

  let responseMessage = data.choices[0].message.content;

  let responsejson = parseGPTJson(responseMessage);

  return responsejson;
}
function parseGPTJson(rawStr) {
  try {
    // Extract inner JSON from ```json ... ``` if present
    const match = rawStr.match(/```json\s*([\s\S]*?)\s*```/i);
    let jsonStr = match ? match[1] : rawStr;

    // Remove any trailing commas before } or ]
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

    // Parse the cleaned JSON
    let parsed = JSON.parse(jsonStr);

    // Handle double-encoded JSON strings
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }

    return parsed;
  } catch (err) {
    throw new Error('Failed to parse GPT JSON: ' + err.message);
  }
}

async function FetchBacktestRanges() {

  let currentdata = new Date();
  let year  = currentdata.getFullYear();
  let month =  (currentdata.getMonth() + 1) > 9 ? (currentdata.getMonth() + 1) : "0" + (currentdata.getMonth() + 1);
  let date =  currentdata.getDate() > 9 ? currentdata.getDate() : "0" + currentdata.getDate();
  let today = year + "-" + month + "-" + date

  const response = await fetch(`https://tradekuber.com/get_strikes_ranges`, {
    method: "POST",
    body: JSON.stringify({
      start_date: today,
      end_date: today,
    }),
  });
  const data = await response.json();
  let alldates = data.data;
  return alldates;
}

async function GetStrikesData(date) {
  let url = "https://tradekuber.com/get_all_strikes";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokken}`,
    },
    body: JSON.stringify({
      created_at: date,
      option: "NIFTY",
      type: "go",
    }),
  });
  const data = await response.json();
  return data.data;
}

async function FetchWholeCombined(date, expiry, start, end) {
  let url = "https://tradekuber.com/get_data_for_range";
  let json = {
    start_date: date,
    expiry: expiry,
    option: "NIFTY",
    start: start,
    end: end,
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokken}`,
    },
    body: JSON.stringify(json),
  });
  const data = await response.json();
  return data.data;
}
