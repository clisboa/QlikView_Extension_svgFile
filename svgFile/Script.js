/** 

    SVG Extension Object for QlikView
    Author: Ralf Becher / Sven Uhlig
    Contact: info@tiq-solutions.de
    Copyright: 2015, TIQ Solutions, Leipzig, Germany
    Use at your own risk. 

*/

(function () {
    var svgsupport = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.0");
    if (svgsupport) {
        SVGMatrix.prototype.toString = function () {
            return "matrix(" + [this.a, this.b, this.c, this.d, this.e, this.f].join(" ") + ")";
        };

        SVGTransform.prototype.toString = function () {
            return this.matrix.toString();
        };
    }

    Qv.AddExtension('svgFile',
        function () {
			var _this = this;
			var path = Qva.Remote + "?public=only&name=Extensions/svgFile";
			var svgFile = this.Layout.Text0.text.toString();
			var pathPrefix = this.Layout.Text1.text.toString();

            var iFrameWidth = this.GetWidth();
            var iFrameHeight = this.GetHeight();
			var objId = this.Layout.ObjectId.replace("\\", "_")
			var pathId = objId + "_path_";
            var div = $('<div />').css({
                height: iFrameHeight,
                width: iFrameWidth
            }).attr({
				id: objId
			}).appendTo($(this.Element).empty());

			if (svgFile.length > 0) {
				if (svgsupport) {
					var jqXHR = [];
					jqXHR.push($.ajax({
						url: path + "/" + svgFile,
						type: "GET",
						dataType: "text" }));
						
					$.when.apply($, jqXHR).always(function(){
						if(typeof(arguments[0]) == "object"){ // Desktop
							var xml = arguments[0].responseText;
						} else {
							var xml = arguments[0];
						}
						if (xml.length == 0) {
							alert("File not found: " + path + "/" + svgFile);
						} else {
							xml = xml.substr(xml.indexOf("<svg"));
							if (pathPrefix.length > 0) {
								xml = xml.replace(new RegExp(escapeRegExp(pathPrefix), 'g'), objId + "_path_");
							}
							console.log(xml);
							
							var svg = $(xml);
							div.append(svg);

							//allow the SVG to adapt its size to the extension box size
							var svgObj = document.getElementsByTagName("svg")[0];							
							svgObj.setAttribute("style", "overflow: hidden; position: relative;"); 
							svgObj.setAttribute("preserveAspectRatio", "xMinYMin"); 
							svgObj.setAttribute("height", iFrameHeight); 
							svgObj.setAttribute("width", iFrameWidth); 
							svgObj.setAttribute("viewBox", [0, 0, iFrameHeight+50, iFrameWidth+50].join(" ")); 
							
							svg.find("path").css({ fill: 'none' });
							var bounds = svg.get(0).getBoundingClientRect();

							var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
							var tooltipcontainer = $(g).appendTo(svg);

							var basetransform = g.getCTM().inverse();
							tooltipcontainer.hide();

							var tooltip_bg = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect')).appendTo(g).attr({
								width: 300,
								height: 300,
								fill: 'white',
								'fill-opacity': 0.8,
								'stroke-width': 1,
								stroke: 'blue',
								'stroke-opacity': 0.8

							});
							var tooltip_text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
							var tooltip = $(tooltip_text).appendTo(tooltipcontainer).attr({
								x: 10,
								y: 10,
								'font-family': 'Verdana, Arial'
							});

							$.each(_this.Data.Rows, $.proxy(function (i, row) {

								var section = row[0].text;
								var title = row[0].text;
								var measure = row[1].text;
								var color = row[2].text;
								var popup = row[3].text;

								if (popup == "-") {
									popup = measure;
								}

								if (pathPrefix.length > 0) {
									section = pathId + section;
								}

								if (!color || color == '-') color = 'lightgray';

								$("#" + section).css({ fill: color, cursor: 'pointer' }).click({ id: section }, $.proxy(function (e) {
									_this.Data.SelectTextsInColumn(0, true, [e.data.id].toString().replace(pathId,""));
								}, _this)).mouseover(function (e) {
									var txt = popup.split('\\n');
									tooltip.empty();
								  
									$(document.createElementNS('http://www.w3.org/2000/svg', 'tspan')).attr({
										dy: 15,
										x: 10,
										'font-weight': 'bold',
										'text-decoration': 'underline'
									}).text(title+":").appendTo(tooltip);
									
									for (i = 0; i < txt.length; i++) {
										$(document.createElementNS('http://www.w3.org/2000/svg', 'tspan')).attr({ dy: i == 0 ? 20 : 15, x: 10 }).text(txt[i]).appendTo(tooltip);
									}
									tooltipcontainer.show();
									var bbox = tooltip_text.getBBox();
									tooltip_bg.attr({
										width: bbox.width + 20,
										height: bbox.height + 20
									});

									var move = function (e) {
										var bbox = tooltip_text.getBBox();
										var x = e.pageX - bounds.left + 10;
										var y = e.pageY - bounds.top - bbox.height - 25;
										if (x + bbox.width + 20 > iFrameWidth)
											x -= (bbox.width + 35);
										if (y < 0)
											y += (bbox.height + 35);
										tooltipcontainer.attr({
											transform: basetransform.translate(x, y).toString()
										});
									}
									$(this).mousemove(move);
									move(e);

								}).mouseout(function () {
									tooltipcontainer.hide();
									$(this).off('mousemove');

								});
							}, this));
						}
					});
				} else {
					$('<p>Your browser does not support SVG graphics.<br />Please use another one.</p>').css({
						width: '80%',
						margin: '0 auto',
						color: 'red'
					}).appendTo($('<div />').css({
						width: iFrameWidth,
						height: iFrameHeight,
						display: 'table-cell',
						'vertical-align': 'middle'
					}).appendTo(div));
				}
				} else {
                $('<p>Please specify an SVG File to load.</p>').css({
                    width: '80%',
                    margin: '0 auto',
                    color: 'red'
                }).appendTo($('<div />').css({
                    width: iFrameWidth,
                    height: iFrameHeight,
                    display: 'table-cell',
                    'vertical-align': 'middle'
                }).appendTo(div));
            }
        }
    )
    //});

})();

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
