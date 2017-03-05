
// Steps: Creating a Bar Chart
// --------------------------------------------------------
// 0. Define styles for elements and classes in style.css

// 1. Set up an SVG canvas

    const height = 600;
    const width = 1100;

    const padding = {
        top: 20,
        right: 0,
        bottom: 90,
        left: 40
    }

    const svg = d3.select('#chart')
                .attr('height', height)
                .attr('width', width)

// (optional) Add functions

    //Calculating Partisan Score for the color scale
    function partisanScore(d) {
        return d.democraticReps / (d.democraticReps + d.republicanReps)
        //e.g Georgia: 10 / 10+4 ==> 10/14 ==> 0.74
    }

    // Number formatting
    let format = d3.format('$,');

// 2. Compute min's and max's data
    const medianIncomeMin = d3.min(states, (d) => d.medianIncome);
    const medianIncomeMax = d3.max(states, (d) => d.medianIncome);

// 3. Set Scales
    let xScale = d3.scaleBand()
        .domain(states.map(d => d.name))
        .range([padding.left,width-padding.right])
        .padding(0.1);
    let yScale = d3.scaleLinear()
        .domain([0,medianIncomeMax])
        .range([height-padding.bottom, padding.top])
    let colorScale = d3.scaleLinear()
        .domain([0,1])
        .range(['#d9534f','#0275d8'])
// 4. Draw data
    svg.selectAll('.bar')
        .data(states)
        .enter()
        .append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => xScale(d.name))
            .attr('width', xScale.bandwidth())
            .attr('y', (d) => yScale(d.medianIncome))
            .attr('height', (d) => height-yScale(d.medianIncome)-padding.bottom)
            .attr('opacity', '.8')
            .attr('fill', (d) => colorScale(partisanScore(d)))
            .attr('data-toggle', 'popover')
            .attr('title', (d) => (d.name))
            .attr('data-content', (d) => (`Median income: ${d3.format('$,')(d.medianIncome)}`))
        .exit();

    d3.select('#table-data')
        .selectAll('tr')
        .data(states)
        .enter()
        .append('tr')
        .html((d) => `
            <td><strong>${d.name}</strong></td>
            <td>${format(d.medianIncome)}</td>
            <td>${(d.democraticReps)}</td>
            <td>${(d.republicanReps)}</td>
        `)
        .exit();

// 5. Axes
    svg.append('g')
        .attr('class', 'right-axis')
        .attr("transform", "translate(0,0)")
        .call(d3.axisRight(yScale)
            .ticks(8, '$,.2r')
            .tickSize(width)
        )

    let yAxis = d3.select('.right-axis');
        yAxis.select('.domain').remove();
        yAxis.selectAll('.tick:not(:first-of-type) line')
            .attr('stroke', '#292b2c')
            .attr('stroke-dasharray', '2,2')
        yAxis.selectAll('.tick:first-of-type text').remove();
        yAxis.selectAll('.tick text').attr('x', 0).attr('dy', -4);

    let xAxis = d3.axisBottom(xScale);
    svg.append('g')
        .attr('class', 'bottom-axis')
        .attr("transform", "translate(0," + (height-padding.bottom) + ")")
        .call(xAxis)
        .selectAll("text")
            .attr("transform", "rotate(90) translate(12," + (-3-xScale.bandwidth()/2) + ")")
            .style("text-anchor", "start");

// 6. Sorting Animation
    d3.select('input#sortData').on('change', change);

    let sortTimeout = setTimeout(function() {
        d3.select('input#sortData')
            .property('checked', true)
            .each(change);
    }, 2000);

    function change() {
        states.sort(function(x,y){
            return d3.descending(x.medianIncome, y.medianIncome)
        })

        clearTimeout(sortTimeout);

        // Copy-on-write since tweens are evaluated after a delay.
        let xScale0 = xScale.domain(states.sort(this.checked
            ? function(a, b) { return d3.descending(a.medianIncome, b.medianIncome); }
            : function(a, b) { return d3.ascending(a.name, b.name) })
        .map(function(d) { return d.name; }))
        .copy();

        svg.selectAll('.bar')
            .sort((a, b) => xScale0(a.name) - xScale0(b.name));

        let transition = svg.transition().duration(750),
            delay = function(d, i) { return i * 35; };

        transition.selectAll('.bar')
            .delay(delay)
            .attr('x', function(d) { return xScale0(d.name); });

        transition.select('.bottom-axis')
            .call(xAxis)
            .selectAll('g')
            .delay(delay);
        }
