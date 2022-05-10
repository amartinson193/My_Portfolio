preGrouped = d3.json('./data/polls.json');
//extraCredit = d3.csv('./data/polls.csv');

Promise.all([d3.csv('./data/forecasts.csv'), preGrouped]).then( data =>
    {
        console.log(data);
        let forecastData = data[0];
        let pollData = data[1];

        /////////////////
        // EXTRA CREDIT//
        /////////////////
        /**
         * replace preGrouped with extraCredit and uncomment the line that defines extraCredit.
         * Then use d3.rollup to group the csvfile on the fly.
         * 
         * If you are not doing the extra credit, you do not need to change this file.
         */

        // ++++++++ BEGIN CUT +++++++++++
        // const candidates = new Set(['Trump', 'Biden']); // only care about trump vs. biden for this viz.
        // let rolledPollData = d3.rollup(pollData, stateList => {
        //     let uniqueList = d3.rollup(stateList, pollList => {
        //         if (pollList.length === 0)
        //         {
        //             return {}
        //         }

        //         let state = pollList[0].state;
        //         let name = pollList[0].pollster;

        //         let groupedPollList = d3.groups(pollList, d => d.question_id);
        //         // groupedPollList = groupedPollList.filter(([q_id, answers]))

        //         let onlyRelevantQuestions = groupedPollList.map( ([_, answerList]) => {
        //             // remove extra candidates
        //             relevantAnswers = answerList.filter(d => candidates.has(d.answer));
        //             return relevantAnswers;
        //         });
        //         // remove any questions that did not include both trump and biden as answers
        //         onlyRelevantQuestions = onlyRelevantQuestions.filter(d => d.length === 2);
        //         let trumpTotal = 0;
        //         let bidenTotal = 0;
        //         for (let question of onlyRelevantQuestions)
        //         {
        //             // average in the case where there are multiple questions about Trump and
        //             // Biden in a single poll.
        //             for (let answerRow of question)
        //             {
        //                 if (answerRow.answer === 'Trump')
        //                 {
        //                     trumpTotal += +answerRow.pct;
        //                 }
        //                 else if (answerRow.answer === 'Biden')
        //                 {
        //                     bidenTotal += +answerRow.pct;
        //                 }
        //             }
        //         }

        //         let trumpResult = trumpTotal / onlyRelevantQuestions.length;
        //         let bidenResult = bidenTotal / onlyRelevantQuestions.length;

        //         let margin = trumpResult - bidenResult;
        //         return {state: state, name: name, margin: margin}
        //     }, d => d.poll_id);
        //     return Array.from(uniqueList.values());
        // }, d => d.state);
        // console.log(rolledPollData);
        // ++++++++  END CUT  +++++++++++
        
        rolledPollData = new Map(pollData); //  convert to a Map object for consistency with d3.rollup
        console.log(rolledPollData)
        let table = new Table(forecastData, rolledPollData);
        table.drawTable();
    });