this.Widget = this.Widget||{};
(function(){
	/**
	 * 初始化曲线组件
	 * @param {Object组件容器选择符，同css选择符} boxElement
	 */
	function Sector(boxElement){
		//canvas
		this.canvas = document.createElement("canvas");
		//组件容器
		this.boxElement = document.querySelector(boxElement);
		//组件配置参数
		this.config = null;
		//组件数据
		this.dataProvider = null;
		//组件通信事件触发器
		this.EventDispatcher = $({});
		//显示对象地图
		this.nodeMap = null;
        this.boxElement.appendChild(this.canvas);
        this.stage = new createjs.Stage(this.canvas);
        this.stage.enableMouseOver(10);
        this.stage.cursor = "pointer";
        createjs.Touch.enable(this.stage);
        createjs.Ticker.on("tick",this.stage);
        //动画
        this.AnimateObj = null;
	};
	var p = Sector.prototype;
	/**
	 * 初始化组件配置
	 * @param {Object组件配置参数} config
	 */
	p.setConfig = function(config){
		this.config = config;
	}
	/**
	 * 数据发生改变时，需要重新创建元素
	 * @param {Object组件数据} data
	 */
	p.setDataProvider = function(data){
		this.dataProvider = data;
		//初始化组件显示对象
		this._createContent();
	}
	/**
     * 初始化组件尺寸或resize时调用
     * @param size 最新尺寸：{width: 100, height: 100}
     */
    p.resize = function(size)
    {
    	this.canvas.width = size.width;
    	this.canvas.height = size.height;
    	this._layout();
    }
    /**
     * 初始化组件显示对象
     */
    p._createContent = function(){
    	if (this.config == null || this.dataProvider == null) return;
    	//每次都清空显示对象列表
    	//引用给nodeMap，每次this.nodeMap太麻烦了
    	var nodeMap = this.nodeMap = {};
    	this.AnimateObj = null;
    	//总容器
    	nodeMap.containers = new createjs.Container();
    	//扇形容器
    	nodeMap.SectorCon = new createjs.Container();
    	//线条容器
    	nodeMap.lineCon = new createjs.Container();
    	//提示文字容器
    	nodeMap.textCon = new createjs.Container();
    	//提示文字容器
    	nodeMap.rankingCon = new createjs.Container();
    	nodeMap.SectorCon.x = nodeMap.lineCon.x = nodeMap.textCon.x = nodeMap.rankingCon.x = this.config.left;
    	//添加显示对象到舞台
    	this.stage.addChild(nodeMap.containers);
    	nodeMap.containers.addChild(nodeMap.SectorCon);
    	nodeMap.containers.addChild(nodeMap.lineCon);
    	nodeMap.containers.addChild(nodeMap.textCon);
    	nodeMap.containers.addChild(nodeMap.rankingCon);
    	var maxValue = 0,index = 0;
	var cur = this;
    	this.dataProvider.sort(function(a,b){
    		return a[cur.config.valueField] - b[cur.config.valueField];
    	})
   /*	this.dataProvider.sort((a,b)=>{return a[this.config.valueField] - b[this.config.valueField];})*/
    	for (var i = 0; i < this.dataProvider.length; i++) {
    		//扇形
    		var sectorLine = new createjs.Shape();
    		nodeMap.SectorCon.addChild(sectorLine);
    		//文字
    		var txt = new createjs.Text(this.dataProvider[i][this.config.labelField],this.config.fontStyle,this.config.fontdefaultColor);
    		nodeMap.textCon.addChild(txt);
    		sectorLine.information = txt;
    		//虚线条
    		var line = new createjs.Shape();
    		nodeMap.lineCon.addChild(line);
    		sectorLine.Leader = line;
    		//序号
    		var rankingtxt = new createjs.Text(this.dataProvider.length-i,this.config.fontStyle,this.config.fontdefaultColor);
    		nodeMap.rankingCon.addChild(rankingtxt);
    		sectorLine.rankingtxt = rankingtxt;
    		if(maxValue < this.dataProvider[i][this.config.labelField].length){
    			maxValue = this.dataProvider[i][this.config.labelField].length;
    			index = i;
    		}
    	}
    	this.config.right = new createjs.Text(this.dataProvider[index][this.config.labelField],this.config.fontStyle,"#000").getBounds().width;
    	this._layout();
    }
    //显示对象布局
    p._layout = function(){
    	if (this.config == null || this.dataProvider == null) return;
    	var itemSpacing = (Math.min(this.canvas.height,this.canvas.width) - this.dataProvider.length*this.config.itemWidth) / this.dataProvider.length;
    	if(itemSpacing<15){
    		itemSpacing = 15;
    	}
    	this.config.itemSpacing = itemSpacing;
    	for (var i = 0; i < this.nodeMap.SectorCon.children.length; i++) {
    		//扇形布局
    		var r = i*this.config.itemSpacing+this.config.itemSpacing;
    		var sectorLine = this.nodeMap.SectorCon.children[i];
    		sectorLine.r = r;
    		sectorLine.alpha = 0;
    		sectorLine.time = 0;
    		sectorLine.x = (this.canvas.width * 3 / 5 - this.nodeMap.SectorCon.x) / 2;
	    	sectorLine.y = this.canvas.height-20;
	    	sectorLine.data = this.dataProvider[i];
			sectorLine.graphics.clear().setStrokeStyle(this.config.itemWidth);
			sectorLine.fillCommand = sectorLine.graphics.beginStroke(this.config.sectordefaultColor).command;
			sectorLine.graphics.arc(0,0,sectorLine.r,PI(225),PI(315));
    		//文字信息布局
    		var txt = this.nodeMap.textCon.children[i];
    		txt.x = this.canvas.width - this.config.right - this.config.left - 10;
    		txt.textBaseline = "middle";
    		txt.alpha = 0;
    		//虚线布局
    		var verSpace = 2,nextX = 0,w = 0;
    		var line = this.nodeMap.lineCon.children[i];
    		line.graphics.clear().setStrokeStyle(2);
    		line.fillCommand = line.graphics.beginStroke(this.config.linedefaultColor).command;
    		line.x = sectorLine.x + Math.cos(PI(45)) * r;
    		line.y = sectorLine.y - Math.sin(PI(45)) * r;
    		txt.y = line.y;//文字和线条同一个Y轴
    		w = txt.x - line.x - 10;
    		while (nextX <= w){
	            line.graphics.moveTo(nextX,0).lineTo(nextX+verSpace,0);
	            nextX += verSpace*2;
	        }
    		line.scaleX = 0;
    		line.graphics.beginStroke(this.config.linepointer).moveTo(w,0).lineTo(w+verSpace,0);
    		//序号布局
    		var rankingtxt = this.nodeMap.rankingCon.children[i];
    		rankingtxt.x = line.x+30;
    		rankingtxt.y = line.y;
    		rankingtxt.alpha = 0;
    		rankingtxt.textBaseline = "bottom";
    	}
    	var lastLine = this.nodeMap.SectorCon.children[0];
    	lastLine.type = "fillshan";
    	lastLine.r = this.config.itemSpacing*1.3;
    	lastLine.graphics.clear();
    	lastLine.fillCommand = lastLine.graphics.beginFill(this.config.linedefaultColor).command;
    	lastLine.graphics.moveTo(0,0).arc(0,0,lastLine.r,PI(225),PI(315));
    	this._events();
    	this._Animate();
    }
    //事件
    p._events = function(){
    	var cur = this;
    	this.nodeMap.SectorCon.on("mouseover",function(e){
    		e.target.fillCommand.style = cur.config.sectorHighlightColor;
    		e.target.fillCommand.style = cur.config.sectorHighlightColor;
    		e.target.Leader.fillCommand.style = cur.config.lineHighlightColor;
    		e.target.rankingtxt.color = cur.config.fontHighlightColor;
    		e.target.information.color = cur.config.fontHighlightColor;
    	});
    	this.nodeMap.SectorCon.on("mouseout",function(e){
    		e.target.fillCommand.style = cur.config.sectordefaultColor;
    		e.target.Leader.fillCommand.style = cur.config.linedefaultColor;
    		e.target.rankingtxt.color = cur.config.fontdefaultColor;
    		e.target.information.color = cur.config.fontdefaultColor;
    	});
    }
    //动画
    p._Animate = function(){
    	for (var i = 0; i < this.nodeMap.SectorCon.children.length; i++) {
    		var sectorLine = this.nodeMap.SectorCon.children[i];
    		TweenMax.to(sectorLine,1,{
				alpha:1,
				delay:i*0.1,
				ease:"linear",
				onCompleteParams:[sectorLine],
				onComplete:function(sectorLine){
					TweenMax.to(sectorLine.Leader,1,{
						scaleX:1,
						ease:"linear",
						onStart:function(){
							TweenMax.to(sectorLine.rankingtxt,1,{
								alpha:1,
								delay:0.1,
								ease:"linear"
							});
						},
						onCompleteParams:[sectorLine],
						onComplete:function(sectorLine){
							TweenMax.to(sectorLine.information,1,{
								alpha:1,
								ease:"linear"
							});
						}
					});
				}
			});
    	}
    	/*for (var i = this.nodeMap.SectorCon.children.length-1; i >= 0; i--) {
    		var sectorLine = this.nodeMap.SectorCon.children[i];
    		TweenMax.to(sectorLine,1,{
				time:1,
				delay:(this.nodeMap.SectorCon.children.length-i)*0.03,
				ease:"linear",
				onCompleteParams:[sectorLine],
				onComplete:function(sectorLine){
					TweenMax.to(sectorLine.Leader,1,{
						scaleX:1,
						ease:"linear",
						onStart:function(){
							TweenMax.to(sectorLine.rankingtxt,1,{
								alpha:1,
								delay:0.1,
								ease:"linear"
							});
						},
						onCompleteParams:[sectorLine],
						onComplete:function(sectorLine){
							TweenMax.to(sectorLine.information,1,{
								alpha:1,
								ease:"linear"
							});
						}
					});
					//sectorLine.Leader
				},
				onUpdateScope:this,
				onUpdateParams:[sectorLine],
				onUpdate:function(sectorLine){
					if(sectorLine.type && sectorLine.type=="fillshan"){
						sectorLine.graphics.clear().setStrokeStyle(this.config.itemWidth);
		    			sectorLine.fillCommand = sectorLine.graphics.beginFill(this.config.sectordefaultColor).command;
						sectorLine.graphics.moveTo(0,0).arc(0,0,sectorLine.r,PI(225),PI(225+(315-225)*sectorLine.time));
					}else{
						sectorLine.graphics.clear().setStrokeStyle(this.config.itemWidth);
		    			sectorLine.fillCommand = sectorLine.graphics.beginStroke(this.config.sectordefaultColor).command;
						sectorLine.graphics.arc(0,0,sectorLine.r,PI(225),PI(225+(315-225)*sectorLine.time));
					}
				}
			});
    	}*/
    }
    function PI(deg){
	    return deg/180*Math.PI;
	}
	this.Widget.Sector = Sector;
})();
