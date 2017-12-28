



const debug = false; // TODO debug output must be sent to a file, otherwise the browser goes insane

const regexRational = /-?\d+\/\d+/;

// TODO
// Check if last month's transactions add up
// Accounts need to be set to negative or positive, good or bad, manually, with widgets
// Write balances above the bars
// Título no eixo dos yy
// Drag the chart

// Account types
const ASSET = "ASSET",
    BANK = "BANK",
    MUTUAL = "MUTUAL",
    CASH = "CASH",
    EQUITY = "EQUITY",
    INCOME = "INCOME",
    EXPENSE = "EXPENSE",
    LIABILITY = "LIABILITY",
    CREDIT = "CREDIT"; //,
// Adjustments = "Ajustes",
// Initial = "Líquido";

const positiveAccountTypes = [ASSET, BANK, MUTUAL, CASH],
    negativeAccountTypes = [EXPENSE, LIABILITY, CREDIT, EQUITY, INCOME],
    goodAccounts = [ASSET, BANK, MUTUAL, CASH, EQUITY],
    badAccounts = [EXPENSE, LIABILITY, CREDIT];
//neutralAccounts = [Adjustments, Initial];

var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S %Z");
var parseDateYearMonth = d3.timeParse("%Y-%m");
var yearMonth = d3.timeFormat("%Y-%m");


function accountsAreSameKind(a, b) {
    if (goodAccounts.includes(a.type) && goodAccounts.includes(b.type) || badAccounts.includes(a.type) && badAccounts.includes(b.type))
        return true;
    else
        return false;
}


function debugPrint(e) { //e is an exception
    console.log(e.message); // "null has no properties"
    console.log(e.name); // "TypeError"
    console.log(e.fileName); // "Scratchpad/1"
    console.log(e.lineNumber); // 2
    console.log(e.columnNumber); // 2
    console.log(e.stack); // "@Scratchpad/2:2:3\n"
}

function getAccountDetails(act) {

}


function getTransactionSplits(trn) {
    return [].map.call(trn.querySelector("splits").querySelectorAll("split"),
        function(split) {
            return {
                id: split.querySelector("id").textContent,
                reconciledState: split.querySelector("reconciled-state").textContent,
                // value: math.eval(split.querySelector("value").textContent),
                // quantity: math.eval(split.querySelector("quantity").textContent),
                value: eval(split.querySelector("value").textContent.match(regexRational)[0]),
                quantity: eval(split.querySelector("quantity").textContent.match(regexRational)[0]),
                account: split.querySelector("account").textContent
            }
        });
}


function parseGnca(error, data) {
    if (error) throw error;

    console.log("data", data);

    var accountsObject = {};
    data.querySelectorAll("account").forEach(act => {
        try {
            var id = act.querySelector("id").textContent;
            accountsObject[id] = {};
            accountsObject[id]["name"] = act.querySelector("name").textContent;
            accountsObject[id]["type"] = act.querySelector("type").textContent;
            accountsObject[id]["commodity"] = act.querySelector("commodity").querySelector("id").textContent;
            accountsObject[id]["description"] = act.querySelector("description").textContent;
        } catch (e) {
            if (debug) {
                debugPrint(e);
            }
        }
    });

    console.log("accountsObject", accountsObject);

    var transactionsObject = {};
    data.querySelectorAll("transaction").forEach(trn => {
        try {
            var id = trn.querySelector("id").textContent;
            transactionsObject[id] = {}
            transactionsObject[id]["currency"] = trn.querySelector("currency").querySelector("id").textContent;
            transactionsObject[id]["datePosted"] = parseDate(trn.querySelector("date-posted").querySelector("date").textContent);
            transactionsObject[id]["description"] = trn.querySelector("description").textContent;
            transactionsObject[id]["splits"] = getTransactionSplits(trn);
        } catch (e) {
            if (debug) {
                debugPrint(e);
            }
        }
    });

    console.log("transactionsObject", transactionsObject);

    // console.log({ "accounts": accountsObject, "transactions": transactions });

    // gncaData = { "accounts": accountsObject, "transactions": transactions };

    main(accountsObject, transactionsObject);
}


function monthlyTotalProfit(accountsObject, transactionsObject) {

    // Bin transactions by year.month
    var data = {},
        points = [];

    for (var trnId in transactionsObject) {
        if (data[yearMonth(transactionsObject[trnId].datePosted)] == undefined) {
            // console.log("##########################");
            // console.log(yearMonth(trn.datePosted));
            data[yearMonth(transactionsObject[trnId].datePosted)] = 0;
        }

        // console.log("##########################");
        // console.log(accountsObject[trn.splits[0].account].name, data[yearMonth(trn.datePosted)]);

        if (!accountsAreSameKind(accountsObject[transactionsObject[trnId].splits[0].account], accountsObject[transactionsObject[trnId].splits[1].account])) {
            if (positiveAccountTypes.includes(accountsObject[transactionsObject[trnId].splits[0].account].type)) {
                console.log(accountsObject[transactionsObject[trnId].splits[0].account].type, "good", transactionsObject[trnId].splits[0].quantity);
                data[yearMonth(transactionsObject[trnId].datePosted)] += transactionsObject[trnId].splits[0].quantity;
            } else {
                console.log(accountsObject[transactionsObject[trnId].splits[0].account].type, "bad", transactionsObject[trnId].splits[0].quantity);
                data[yearMonth(transactionsObject[trnId].datePosted)] -= transactionsObject[trnId].splits[0].quantity;
            }
        }

        // console.log(accountsObject[trn.splits[0].account].name, data[yearMonth(trn.datePosted)]);
        // console.log("##########################");

        // data[yearMonth(trn.datePosted)] +=
        //     positiveAccountTypes.includes(accountsObject[trn.splits[0].account].type) ?
        //     (trn.splits[0].quantity > 0 ? trn.splits[0].quantity : -trn.splits[0].quantity) :
        //     (trn.splits[0].quantity > 0 ? -trn.splits[0].quantity : trn.splits[0].quantity);

    }

    for (var ym in data) {
        points.push({ yearMonth: parseDateYearMonth(ym), quantity: data[ym] });
    }

    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .rangeRound([0, width], .1);

    var y = d3.scaleLinear()
        .range([height, 0]);

    var xAxis = d3.axisBottom(x).tickFormat(yearMonth);

    var yAxis = d3.axisLeft(y);

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(points.map(function(d) { return d.yearMonth; }));
    y.domain(d3.extent(points, function(d) { return d.quantity; }));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + y(0) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.selectAll(".bar")
        .data(points)
        .enter().append("rect")
        .attr("class", function(d) { return "bar bar--" + (d.quantity < 0 ? "negative" : "positive"); })
        .attr("x", function(d) { return x(d.yearMonth); })
        .attr("width", x.bandwidth() * 0.9)
        .attr("y", function(d) { return d.quantity > 0 ? y(d.quantity) : y(0); })
        .attr("height", function(d) { return Math.abs(y(d.quantity) - y(0)); });

}


// Draws a line chart that shows the amount in each account over time
// receives an array of account ids
function accountTimeLines(accountsObject, transactionsObject, accountIds) {

    // If accountIds is empty, null or undefined, draw all accounts

    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.partial); });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    var accountData = {},
        minDate = parseDateYearMonth("3000-12");
    maxDate = parseDateYearMonth("1000-01");
    maxPartial = 0;
    accountIds.forEach(acc => {
        // Get the data
        var data = [],
            partial = 0;
        for (var trnId in transactionsObject) {
            transactionsObject[trnId].splits.forEach(split => {
                if (split.account === acc) {
                    partial += split.quantity;
                    minDate = minDate < transactionsObject[trnId].datePosted ? minDate : transactionsObject[trnId].datePosted;
                    maxDate = maxDate > transactionsObject[trnId].datePosted ? maxDate : transactionsObject[trnId].datePosted;
                    maxPartial = maxPartial > partial ? maxPartial : partial;
                    data.push({ "date": transactionsObject[trnId].datePosted, "partial": partial });
                }
            });
        }
        accountData[acc] = data;
    });

    // Scale the range of the data
    x.domain([minDate, maxDate]);
    y.domain([0, maxPartial]);

    // Add the valueline paths.
    for (var acc in accountData) {
        svg.append("path")
            .data([accountData[acc]])
            .attr("class", "line")
            .attr("d", valueline);
    }

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
}


// This function is called from the callback passed to d3.xml because the callback must be synchronous
// The whole data from the gnca/xml file is loaded and then handled in the main function
function main(accountsObject, transactions) {

    // Make a bar chart
    // monthlyTotalProfit(accountsObject, transactions);

    accountTimeLines(accountsObject, transactions, someAccountIds);

};

// Run CashViz
d3.xml(gncaPath, parseGnca);


