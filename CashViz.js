const debug = false; // TODO debug output must be sent to a file, otherwise the browser goes insane

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

var xmlPath = '20171202_110643_gnucash_export_Livro_1.gnca';
// var xmlPath = 'data.xml';

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
                value: math.eval(split.querySelector("value").textContent),
                quantity: math.eval(split.querySelector("quantity").textContent),
                account: split.querySelector("account").textContent
            }
        });
}

d3.xml(xmlPath, function(error, data) {
    if (error) throw error;

    // Gather account information into an array of account objects
    // var accounts = [].map.call(data.querySelectorAll("account"),
    //     function(act) {
    //         try {
    //             return {
    //                 id: act.querySelector("id").textContent,
    //                 name: act.querySelector("name").textContent,
    //                 type: act.querySelector("type").textContent,
    //                 commodity: act.querySelector("commodity").querySelector("id").textContent,
    //                 description: act.querySelector("description").textContent
    //             };
    //         } catch (e) {
    //             if (debug) {
    //                 debugPrint(e);
    //             }
    //         }
    //     }).filter(function(element) {
    //     return element !== undefined;
    // });

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

    // Gather account information into an array of account objects
    var transactions = [].map.call(data.querySelectorAll("transaction"),
        function(trn) {
            try {
                return {
                    //version: act.getAttribute("version"),
                    currency: trn.querySelector("currency").querySelector("id").textContent,
                    datePosted: parseDate(trn.querySelector("date-posted").querySelector("date").textContent), //TODO: convert to date
                    description: trn.querySelector("description").textContent,
                    splits: getTransactionSplits(trn)
                };
            } catch (e) {
                if (debug) {
                    debugPrint(e);
                }
            }
        }).filter(function(element) {
        return element !== undefined;
    });


    function monthlyTotalProfit(transactionArray) {

        // Bin transactions by year.month
        var data = {},
            points = [];
        transactionArray.forEach(trn => {

            if (data[yearMonth(trn.datePosted)] == undefined) {
                console.log("##########################");
                console.log(yearMonth(trn.datePosted));
                data[yearMonth(trn.datePosted)] = 0;
            }

            console.log("##########################");
            console.log(accountsObject[trn.splits[0].account].name, data[yearMonth(trn.datePosted)]);

            if (!accountsAreSameKind(accountsObject[trn.splits[0].account], accountsObject[trn.splits[1].account])) {
                if (positiveAccountTypes.includes(accountsObject[trn.splits[0].account].type)) {
                    console.log(accountsObject[trn.splits[0].account].type, "good", trn.splits[0].quantity);
                    data[yearMonth(trn.datePosted)] += trn.splits[0].quantity;
                } else {
                    console.log(accountsObject[trn.splits[0].account].type, "bad", trn.splits[0].quantity);
                    data[yearMonth(trn.datePosted)] -= trn.splits[0].quantity;
                }
            }

            console.log(accountsObject[trn.splits[0].account].name, data[yearMonth(trn.datePosted)]);
            console.log("##########################");

            // data[yearMonth(trn.datePosted)] +=
            //     positiveAccountTypes.includes(accountsObject[trn.splits[0].account].type) ?
            //     (trn.splits[0].quantity > 0 ? trn.splits[0].quantity : -trn.splits[0].quantity) :
            //     (trn.splits[0].quantity > 0 ? -trn.splits[0].quantity : trn.splits[0].quantity);
        });

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
        // .append("text")
        // .attr("transform", "rotate(-90)")
        // .attr("y", 6)
        // .attr("dy", ".71em")
        // .style("text-anchor", "end")
        // .text("Profit");

        svg.selectAll(".bar")
            .data(points)
            .enter().append("rect")
            .attr("class", function(d) { return "bar bar--" + (d.quantity < 0 ? "negative" : "positive"); })
            .attr("x", function(d) { return x(d.yearMonth); })
            .attr("width", x.bandwidth() * 0.9)
            .attr("y", function(d) { return d.quantity > 0 ? y(d.quantity) : y(0); })
            .attr("height", function(d) { return Math.abs(y(d.quantity) - y(0)); });

    }

    monthlyTotalProfit(transactions);

});