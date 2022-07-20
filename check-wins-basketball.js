
const checkWinBasketball = (coef, market, otScore, setsScore) => {
    let win = null;
    const score = setsScore.reduce((acc, scoreSet) => {
        const [scoreP1, scoreP2] = scoreSet.split(':');
        acc[0] += +scoreP1;
        acc[1] += +scoreP2;
        return acc;
    }, [0,0]).join(':');
    try {
        if (/^WIN(_OT)?__P[12X]/.test(market)) {
            win = winMarketCheck(market, otScore); 
        } else if (/^SET_[0][12345]__WIN__P[12X]/.test(market)) {
            win = winSetMarketCheck(market, setsScore); 
        } else if (/TOTALS(_OT)?__(UNDER|OVER|EXACT)\((\d*(\.\d*)?)\)/.test(market)) {
            win = totalsBasketballCheck(market, score, otScore, setsScore);
        } else if (/^HANDICAP_OT__P?[12]?X?\([-]?(\d*(\.\d*)?)\)/.test(market)) {
            win = handicapCheckBasketballOT(market, score);
        } else {
            win = null;
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

const totalsBasketballCheck = (market, score, otScore, setsScore) => {
    const allScores = [score, ...setsScore];
    const totalData = market.split('__');
    let setName, team, totalString, marketString;
    if (totalData.length === 2) {
        setName = 'FULL_00'; 
        team = 'PX';
        marketString = totalData[0];
        totalString = totalData[1];
    } else if (totalData.length === 3) {
        setName = 'FULL_00'; 
        team = totalData[0];
        marketString = totalData[1];
        totalString = totalData[2];
    } else if (totalData.length === 4) {
        setName = totalData[0]; 
        team = totalData[1];
        marketString = totalData[2];
        totalString = totalData[3]; 
    }
    const [_, commandIdx] = setName.split('_');
    const [scoreP1, scoreP2] = marketString == 'TOTALS_OT' ? otScore.split(':') : allScores[Number(commandIdx)].split(':');
    let scoreToCheck;
    switch(team) {
        case "PX":
            scoreToCheck = +scoreP1 + +scoreP2;
            break;
        case "P1":
            scoreToCheck = +scoreP1;
            break;
        case "P2":
            scoreToCheck = +scoreP2;
            break;
        default:
            return null;
    }
    
    const [total, valueString] = totalString.split('(');
    const value = +valueString.replace(')', '');
    switch(total) {
        case "UNDER":
            if (scoreToCheck < value) {
                return true;
            } else if (scoreToCheck == value) {
                return [null];
            }
            return false;
            //return scoreToCheck < value;
        case "OVER":
            if (scoreToCheck > value) {
                return true;
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

const winMarketCheck = (market, score) => {
    const [_, type] = market.split('__');
    const [scoreP1, scoreP2] = score.split(':');
    switch (type) {
        case "P1":
            return scoreP1 > scoreP2;
        case "P2":
            return scoreP1 < scoreP2;
        case "PX":
            return scoreP1 == scoreP2;
        default:
            return null;
    }
};

const winSetMarketCheck = (market, setsScore) => {
    const [setString, _, type] = market.split('__');
    const idxSet = Number(setString.split('_')[1]) - 1; 
    const [scoreP1, scoreP2] = setsScore[idxSet].split(':');
    switch (type) {
        case "P1":
            return scoreP1 > scoreP2;
        case "P2":
            return scoreP1 < scoreP2;
        case "PX":
            return scoreP1 == scoreP2;
        default:
            return null;
    }
};


const handicapCheckBasketballOT = (market, score) => {
    const [scoreP1, scoreP2] = score.split(':');
    const [_, handicap] = market.split('__');
    
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


module.exports = { checkWinBasketball };