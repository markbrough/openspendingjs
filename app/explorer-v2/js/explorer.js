var OpenSpending = OpenSpending || {};
OpenSpending.App = {} || OpenSpending.App;

OpenSpending.App.Explorer = function(config) {
  var my = {};
  my.config = config;
  my.dataset = null;

  my.initialize = function() {
    var $parent = $(my.config.target);
    $parent.append($(explorerTmpl));
    var $explorer = $parent.find('.explorer');
    my.containerId = my.config.target + ' .explorer .bubbletree';
    my.$breakdown = $explorer.find('#controls-breakdown');
    var $breakdownList = my.$breakdown.find('ol');
    var model = OpenSpending.Model(my.config);

    var datasetObj = new model.Dataset({
      name: my.config.dataset
    });
    datasetObj.fetch({
      success: initBreakdowns,
      dataType: 'jsonp'
    });

    function initBreakdowns(dataset) {
      my.dataset = dataset;
      $.each([1,2,3], function(idx, item) {
        var tselect = $('<select />');
        tselect.append($('<option />').attr('value', '').html(''));
        $.each(dataset.drilldownDimensions(), function(idx, item) {
          tselect.append($('<option />').attr('value', item).html(item));
        });
        $breakdownList.append($('<li />').append(tselect));
      });
      my.$breakdown.find('button').click(function(e) {
        e.preventDefault();
        my.draw();
      });
    }

    if (my.config.defaults && my.config.defaults.drilldowns) {
      my.config.drilldowns = my.config.defaults.drilldowns;
      my.renderTree(my.containerId);
    } else {
      $('.loading').html('Please select drilldown from sidebar and hit redraw');
    }
  };

  my.draw = function() {
    var vals = [];
    $.each(my.$breakdown.find('select option:selected'), function(idx, item) {
      var _dim = $(item).text();
      // ignore the empty string
      if (_dim) {
        vals.push(_dim);
      }
    });
    vals = _.uniq(vals);
    my.config.drilldowns = vals;
    if (my.config.drilldowns.length > 0) {
      my.renderTree(my.containerId);
    }
  };

  my.renderTree = function(figId) {
    $('.loading').html('Loading data <img src="http://m.okfn.org.s3.amazonaws.com/images/icons/ajaxload-circle.gif" />');
    $('.loading').show();
    var $tooltip = $('<div class="tooltip">Tooltip</div>');
    $(figId).append($tooltip);
    $tooltip.hide();
    
    var tooltip = function(event) {
      if (event.type == 'SHOW') {
        // show tooltip
        vis4.log(event);
        $tooltip.css({ 
          left: event.mousePos.x + 4, 
          top: event.mousePos.y + 4 
        });
        $tooltip.html(event.node.label+' <b>'+event.node.famount+'</b>');
        var bubble = event.target;
        
        $tooltip.show();
      } else {
        // hide tooltip
        $tooltip.hide();
      }
    };
    
	var getTooltip = function() {
		return this.getAttribute('tooltip');
	};
	
	var initTooltip = function(node, domnode) {
		vis4.log($(domnode).tooltip);
		vis4.log(node.label + ' - '+node.famount);
		domnode.setAttribute('tooltip', node.label + ' <b>'+node.famount+'</b>');
		
		//vis4.log(domnode.getAttribute('tooltip'));
		
		$(domnode).tooltip({ delay: 100, bodyHandler: getTooltip });
	};
    
    var dataLoaded = function(data) {
      $('.loading').hide();
      if (my.lastConfig && my.lastConfig.instance) {
  	    my.lastConfig.instance.clean();
      }
      var config = {
        data: data,
        container: figId,
        rootNodeLabel: 'Grant total',
        bubbleType: 'icon',
        bubbleStyles: {
          // 'cofog': OpenSpending.BubbleTree.Styles.Cofog
        },
        initTooltip: initTooltip,
        maxNodesPerLevel: 15
//        tooltipCallback: tooltip
      };
      new OpenSpending.BubbleTree.Loader(config);
      my.lastConfig = config;
    };
    
    // call openspending api for data
    new OpenSpending.Aggregator({
      apiUrl: my.config.endpoint + 'api',
      dataset: my.config.dataset,
      drilldowns: my.config.drilldowns,
      // localApiCache: '../bubbletree/examples/cra/aggregate.json',
      // breakdown: 'region',
      callback: dataLoaded
    });
  };

  explorerTmpl = ' \
    <div class="explorer"> \
      <div id="controls"> \
       <div id="controls-year"> \
          <h3>Year: <span id="year">2009</span></h3> \
          <div id="yearslider"></div> \
          <div id="year-range"></div> \
        </div> \
       <div id="controls-breakdown"> \
         <h3>Breakdown by</h3> \
         <ol id="breakdown-list"> \
         </ol> \
         <button>Redraw</button> \
       </div> \
      </div> \
      <div class="loading"></div> \
      <div class="bubbletree-wrapper"> \
        <div class="bubbletree"></div> \
      </div> \
    </div> \
  ';

  return my;
};

