
const checkWin = (coef, market, score, firstHalfScore, corners, goals) => {
    let win = null;
    try {
        if (/^WIN__P[12X]/.test(market)) {
            win = winMarketCheck(market, score); 
        } else if (/^WIN__(1X|12|X2)/.test(market)) {
            win = doubleChanseCheck(market, score); 
        } else if (/^HALF_[0][12]__WIN__P[X12]/.test(market)) {
            win = halfCheck(market, score, firstHalfScore);   
        } else if (/^TOTALS__(EVEN|ODD)/.test(market)) {
            win = totalsEvenOddCheck(market, score);
        } else if (/^(P[12]__)?TOTALS__(UNDER|OVER|EXACT)\((\d*(\.\d*)?)\)/.test(market)) {
            win = totalsCheck(market, score);    
        } else if (/HANDICAP__P?[12]?X?\([-]?(\d*(\.\d*)?)\)/.test(market)) {
            win = handicapCheck(market, score, firstHalfScore);   
        } else if (/CORRECT_SCORE\((\d*)\:(\d*)\)/.test(market)) {
            win = correctScore(market, score, firstHalfScore);    
        } else if (/^HALF_[0][12]__TOTALS__(UNDER|OVER|EXACT)\((\d*(\.\d*)?)\)/.test(market)) {
            win = halfTotalsCheck(market, score, firstHalfScore); 
        } else if (/^BOTH_TEAMS_TO_SCORE__(YES|NO)/.test(market)) {
            win = bothTeamsToScore(market, score)
        } else if (/HANDICAP_3W__P?[12]?X?\([-]?(\d*(\.\d*)?)\)/.test(market)) {
            win = handicap3WCheck(market, score, firstHalfScore) 
        } else if (/TOTALS_(3W_)?CORNERS__(UNDER|OVER|EXACT)\((\d*(\.\d*)?)\)/.test(market)) {
            win = totalCorners(market, corners)
        } else if (/^CLEAN_SHEET__P[12]__(YES|NO)/.test(market)) {
            win = cleanSheet(market, score)
        } else if (/WHO_SCORE_3W__\d\d__(P1|P2|NO)/.test(market)) {
            win = whoScore(market, goals);
        } else {
            win = null
            console.log(market);
        } 
    } catch(err) {
        console.log(market);
        throw err;
    }
    const resultCoeffValue = resultCoeff(coef, win);
    return {
        win: Array.isArray(win) ? Boolean(Math.max(...win)) : win, 
        deltaProfit: resultCoeffValue == null ? null : Math.floor((resultCoeffValue - 1) * 1000) / 1000
    };
};

const resultCoeff = (coeff, win) => {
    if (win == null) {
        return null;
    } else if (Array.isArray(win)) {
        const coefEach = coeff / win.length;
        return Math.floor(win.reduce((acc, el) => {
            switch (el) {
                case true:
                    return acc + coefEach;
                case false:
                    return acc + 0;
                default:
                    return acc + 1 / win.length;
            }
        }, 0) * 1000) / 1000;
    } else if (win) {
        return coeff;
    }
    return 0;
}

const winMarketCheck = (market, score) => {
    const [scoreP1, scoreP2] = score.split(':');
    switch (market) {
        case "WIN__P1":
            return scoreP1 > scoreP2;
        case "WIN__P2":
            return scoreP1 < scoreP2;
        case "WIN__PX":
            return scoreP1 == scoreP2;
        default:
            return null;
    }
};

const doubleChanseCheck = (market, score) => {
    const [scoreP1, scoreP2] = score.split(':');
    switch (market) {
        case "WIN__1X":
            return scoreP1 >= scoreP2;
        case "WIN__12":
            return scoreP1 != scoreP2;
        case "WIN__X2":
            return scoreP1 <= scoreP2;
        default:
            return null;
    }   
};

const bothTeamsToScore = (market, score) => {
   const [scoreP1, scoreP2] = score.split(':');
   const [_, result] = market.split('__');
   switch (result) {
        case "YES":
            return (+scoreP1) > 0 && (+scoreP2) > 0;
        case "NO":
            return (+scoreP1) == 0 || (+scoreP2) == 0;
        default:
            return null;
    }
}

const halfCheck = (market, score, firstHalfScore) => {
    if (!firstHalfScore) {
        return null;
    }
    const [halfString, _, winner] = market.split('__');
    const [scoreP1, scoreP2] = score.split(':');
    const [firstHalfScoreP1, firstHalfScoreP2] = firstHalfScore.split(':');
    const scoresByHalfs = [
        {
            scoreP1: +firstHalfScoreP1,
            scoreP2: +firstHalfScoreP2,
        },
        {
            scoreP1: scoreP1 - firstHalfScoreP1,
            scoreP2: scoreP2 - firstHalfScoreP2,
        }
    ];
    const halfIdx = +halfString.split('_')[1] - 1;
    const {scoreP1: P1, scoreP2: P2} = scoresByHalfs[halfIdx];
    
    switch (winner) {
        case "P1":
            return P1 > P2;
        case "P2":
            return P1 < P2;
        case "PX":
            return P1 == P2;
        default:
            return null;
    }
};

const totalsEvenOddCheck = (market, score) => {
    const [scoreP1, scoreP2] = score.split(':');
    const [_, type] = market.trim().split('__');
    switch (type) {
        case "ODD":
            return (+scoreP1 + +scoreP2) % 2 === 1;
        case "EVEN":
            return (+scoreP1 + +scoreP2) % 2 === 0;
        default:
            return null;
    }
};

const totalsCheck = (market, score) => {
    let marketName = market.trim();
    if (marketName.startsWith('TOTALS')) {
       marketName = 'PX__' + marketName; 
    }
    const [scoreP1, scoreP2] = score.split(':');
    const [type, _, totalString] = marketName.split('__');
    let scoreToCheck;
    switch(type) {
        case "PX":
            scoreToCheck = +scoreP1 + +scoreP2;
            break;
        case "P1":
            scoreToCheck = scoreP1;
            break;
        case "P2":
            scoreToCheck = scoreP2;
            break;
        default:
            return null;
    }
    const [total, valueString] = totalString.split('(');
    const value = +valueString.replace(')', '');
    switch(total) {
        case "UNDER":
            if (scoreToCheck < value) {
                return true
            } else if (scoreToCheck == value) {
                return [null];
            }
            return false;
            //return scoreToCheck < value;
        case "OVER":
            if (scoreToCheck > value) {
                return true
            } else if (scoreToCheck == value) {
                return [null];
            }
            return false;
            //return scoreToCheck > value;
        case "EXACT":
            return scoreToCheck == value;
        default:
            return null;
    }
};

const halfTotalsCheck = (market, score, firstHalfScore) => {
    let marketName = market.trim();
    const [scoreP1full, scoreP2full] = score.split(':');
    const [firstHalfScoreP1, firstHalfScoreP2] = firstHalfScore === null ? [null, null]: firstHalfScore.split(':');
    const scoresByHalfs = [
        {
            scoreP1: firstHalfScoreP1 === null ? null : +firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : +firstHalfScoreP2,
        },
        {
            scoreP1: firstHalfScoreP1 === null ? null : scoreP1full - firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : scoreP2full - firstHalfScoreP2,
        }
    ];
    const [halfString, _, totalString] = marketName.split('__');
    const halfIdx = +halfString.split('_')[1] - 1;
    const {scoreP1, scoreP2} = scoresByHalfs[halfIdx];
    let scoreToCheck = +scoreP1 + +scoreP2;
    // switch(type) {
    //     case "PX":
    //         scoreToCheck = +scoreP1 + +scoreP2;
    //         break;
    //     case "P1":
    //         scoreToCheck = scoreP1;
    //         break;
    //     case "P2":
    //         scoreToCheck = scoreP2;
    //         break;
    //     default:
    //         return null;
    // }
    const [total, valueString] = totalString.split('(');
    const value = +valueString.replace(')', '');
    switch(total) {
        case "UNDER":
            return scoreToCheck < value;
        case "OVER":
            return scoreToCheck > value;
        case "EXACT":
            return scoreToCheck == value;
        default:
            return null;
    }
};

const handicap3WCheck = (market, score, firstHalfScore) => {
    let marketName = market.trim();
    if (marketName.startsWith('HANDICAP')) {
       marketName = 'FULL_00__' + marketName; 
    }
    const [scoreP1full, scoreP2full] = score.split(':');
    const [firstHalfScoreP1, firstHalfScoreP2] = firstHalfScore === null ? [null, null]: firstHalfScore.split(':');
    const scoresByHalfs = [
        {
            scoreP1: +scoreP1full,
            scoreP2: +scoreP2full,
        },
        {
            scoreP1: firstHalfScoreP1 === null ? null : +firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : +firstHalfScoreP2,
        },
        {
            scoreP1: firstHalfScoreP1 === null ? null : scoreP1full - firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : scoreP2full - firstHalfScoreP2,
        }
    ];
    
    const [typeHandicap, _, handicap] = marketName.split('__');
    const halfIdx = Number(typeHandicap.split('_')[1]);
    const {scoreP1, scoreP2} = scoresByHalfs[halfIdx];
    const [type, countString] = handicap.split('(');
    const count = +countString.replace(')', '');
    
    switch(type) {
        case "PX":
            return +scoreP2 + count == +scoreP1;
        case "P1":
            return +scoreP1 + count > +scoreP2;
        case "P2":
            return +scoreP2 + count > +scoreP1;
        default:
            return null;
    }
};

const cleanSheet = (market, score) => {
    const [scoreP1, scoreP2] = score.split(':');
    const [_, command, type] = market.trim().split('__');
    let counter
    switch (command) {
        case "P1":
            counter = +scoreP1;
            break;
        case "P2":
            counter = +scoreP2;
            break;
        default:
            return null;
    }
    
    switch (type) {
        case "YES":
            return counter == 0;
        case "NO":
            return counter > 0;
        default:
            return null;
    }
}

const totalCorners = (market, corners) => {
    if (corners == null) {
        return null;
    }
    let marketName = market.trim();
    if (marketName.startsWith('TOTALS')) {
       marketName = 'FULL_00__' + marketName; 
    }
    const [typeCorner, _, totalString] = marketName.split('__');
    const halfIdx = Number(typeCorner.split('_')[1]);
    const { cornerP1, cornerP2 } = corners[halfIdx];
    if (cornerP1 == null || cornerP2 == null) {
        return null;
    }
    const [total, valueString] = totalString.split('(');
    const value = +valueString.replace(')', '');
    const scoreToCheck = cornerP1 + cornerP2;
    switch(total) {
        case "UNDER":
            // if (scoreToCheck < value) {
            //     return true
            // } else if (scoreToCheck == value) {
            //     return [null];
            // }
            return scoreToCheck < value;
        case "OVER":
            return scoreToCheck > value;
        case "EXACT":
            return scoreToCheck == value;
        default:
            return null;
    }
    
}

const handicapCheck = (market, score, firstHalfScore) => {
    if (!firstHalfScore && !market.startsWith('HANDICAP')) {
        return null;
    }
    let marketName = market.trim();
    if (marketName.startsWith('HANDICAP')) {
       marketName = 'FULL_00__' + marketName; 
    }
    const [scoreP1full, scoreP2full] = score.split(':');
    const [firstHalfScoreP1, firstHalfScoreP2] = firstHalfScore === null ? [null, null]: firstHalfScore.split(':');
    const scoresByHalfs = [
        {
            scoreP1: +scoreP1full,
            scoreP2: +scoreP2full,
        },
        {
            scoreP1: firstHalfScoreP1 === null ? null : +firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : +firstHalfScoreP2,
        },
        {
            scoreP1: firstHalfScoreP1 === null ? null : scoreP1full - firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : scoreP2full - firstHalfScoreP2,
        }
    ];
    const [typeHandicap, _, handicap] = marketName.split('__');
    const halfIdx = Number(typeHandicap.split('_')[1]);
    const {scoreP1, scoreP2} = scoresByHalfs[halfIdx];
    
    const [type, countString] = handicap.split('(');
    const count = +countString.replace(')', '');
    const handicaps = [];
    const forCheckAsian = count - Math.floor(count);
    const isAsianHandicap = forCheckAsian === 0.25 || forCheckAsian === 0.75;
    if (isAsianHandicap) {
        handicaps.push(count + 0.25);
        handicaps.push(count - 0.25);
    } else {
        handicaps.push(count);
    }
    const scoresForAdd = type === 'P1' ? scoreP1 : type === 'P2' ? scoreP2 : null;
    const scoresForCheck = type === 'P1' ? scoreP2 : type === 'P2' ? scoreP1 : null;
    if (scoresForAdd === null) {
        return null;
    }
    return handicaps.map((handi)=> {
        
        if ((scoresForAdd + handi) > scoresForCheck) {
            return true;
        } else if ((scoresForAdd + handi) == scoresForCheck) {
            return null;
        }
        return false;    
    });
};

const correctScore = (market, score, firstHalfScore) => {
    //HALF_01__CORRECT_SCORE
    if (!firstHalfScore && !market.startsWith('CORRECT_SCORE')) {
        return null;
    }
    let marketName = market.trim();
    if (marketName.startsWith('CORRECT_SCORE')) {
       marketName = 'FULL_00__' + marketName; 
    }
    const [type, correctMarket] = marketName.split('__');
    const [_, scoreCorrectString] = correctMarket.split('(');
    const [correctP1, correctP2] = scoreCorrectString.replace(')', '').split(':');
    const [scoreP1full, scoreP2full] = score.split(':');
    const [firstHalfScoreP1, firstHalfScoreP2] = firstHalfScore === null ? [null, null]: firstHalfScore.split(':');
    const scoresByHalfs = [
        {
            scoreP1: +scoreP1full,
            scoreP2: +scoreP2full,
        },
        {
            scoreP1: firstHalfScoreP1 === null ? null : +firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : +firstHalfScoreP2,
        },
        {
            scoreP1: firstHalfScoreP1 === null ? null : scoreP1full - firstHalfScoreP1,
            scoreP2: firstHalfScoreP2 === null ? null : scoreP2full - firstHalfScoreP2,
        }
    ];
    const halfIdx = +type.split('_')[1];
    const {scoreP1, scoreP2} = scoresByHalfs[halfIdx];
    return scoreP1 == +correctP1 && scoreP2 == +correctP2;
}

const whoScore = (market, goals) => {
    const [_, numberOfGoal, type] = market.trim().split('__');
    const result = goals[+numberOfGoal - 1];
    switch(type) {
        case 'P1':
            return result === 'P1';
        case 'P2':
            return result === 'P2';
        case 'NO':
            return result === undefined;
    }   
}


module.exports = { checkWin };