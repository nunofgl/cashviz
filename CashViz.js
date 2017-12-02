var debug = false; // TODO debug output must be sent to a file, otherwise the browser goes insane

var xmlPath = '20171202_110643_gnucash_export_Livro_1.gnca';
// var xmlPath = 'data.xml';

var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S %Z");

var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scaleBand()
    .rangeRound([0, width], .1);

var y = d3.scaleLinear()
    .range([height, 0]);

var xAxis = d3.axisBottom(x);

var yAxis = d3.axisLeft(y);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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
    // console.log([].map.call(trn.querySelector("splits").querySelectorAll("split"),
    //     function(split) {
    //         return {
    //             id: split.querySelector("id").textContent,
    //             reconciledState: split.querySelector("reconciled-state").textContent,
    //             value: math.eval(split.querySelector("value").textContent),
    //             quantity: split.querySelector("quantity").textContent,
    //             account: math.eval(split.querySelector("account").textContent)
    //         }
    //     }));
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
    var accounts = [].map.call(data.querySelectorAll("account"),
        function(act) {
            try {
                return {
                    //version: act.getAttribute("version"),
                    id: act.querySelector("id").textContent,
                    name: act.querySelector("name").textContent,
                    type: act.querySelector("type").textContent,
                    commodity: act.querySelector("commodity").querySelector("id").textContent,
                    description: act.querySelector("description").textContent
                };
            } catch (e) {
                if (debug) {
                    debugPrint(e);
                }
            }
        }).filter(function(element) {
        return element !== undefined;
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

    console.log(transactions);

    // Convert the XML document to an array of objects.
    // Note that querySelectorAll returns a NodeList, not a proper Array,
    // so we must use map.call to invoke array methods.
    // data = [].map.call(data.querySelectorAll("letter"), function(letter) {
    //     return {
    //         letter: letter.getAttribute("id"),
    //         frequency: +letter.querySelector("frequency").textContent
    //     };
    // });

    /*
    x.domain(data.map(function(d) { return d.letter; }));
    y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.letter); })
        .attr("width", x.bandwidth() * 0.9)
        .attr("y", function(d) { return y(d.frequency); })
        .attr("height", function(d) { return height - y(d.frequency); });
*/
});