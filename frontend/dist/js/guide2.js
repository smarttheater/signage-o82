(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["guide2"],{"7d54":function(t,e,n){},"965d":function(t,e,n){"use strict";var a=n("7d54"),r=n.n(a);r.a},fb6f:function(t,e,n){"use strict";n.r(e);var a=function(){var t=this,e=t.$createElement,n=t._self._c||e;return t.is_initialized?n("div",{staticClass:"svgcontainer guide2"},[t.socket?t._e():n("timer",{on:{tick:t.fetchJsonData}}),t._l(t.REQUIRED_JSONID_ARRAY,function(e){return n("div",{key:e},[n("h1",{class:"status status-"+e+" status-type-"+t.statusDataDic[e].type},[n("span",[t._v(t._s(t.statusDataDic[e].statusString))]),n("div",{directives:[{name:"show",rawName:"v-show",value:t.statusDataDic[e].type===t.ENUM_LOCAL_EVENT_STATUS_TYPE.MESSAGE,expression:"statusDataDic[eventName].type === ENUM_LOCAL_EVENT_STATUS_TYPE.MESSAGE"}],staticClass:"cover"})])])})],2):t._e()},r=[],s=n("cebc"),c=(n("96cf"),n("3b8d")),i=n("2b0e"),u=n("205d"),o=n("0eb6"),f=n("3bf0"),h=[f["b"].FURIFURI,f["b"].CRUNCH],D=i["a"].extend({name:"Guide2",data:function(){return{is_initialized:!1,busy_fetchJsonData:!1,jsonFetcher:new o["a"](h),socket:null,statusDataDic:{},REQUIRED_JSONID_ARRAY:h,ENUM_LOCAL_EVENT_STATUS_TYPE:f["c"]}},created:function(){var t=Object(c["a"])(regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(t){while(1)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,this.jsonFetcher.fetchData();case 3:this.statusDataDic=t.sent,t.next=9;break;case 6:return t.prev=6,t.t0=t["catch"](0),t.abrupt("return",alert(t.t0.message));case 9:return t.next=11,this.connectSocket();case 11:this.socket=t.sent,this.is_initialized=!0;case 13:case"end":return t.stop()}},t,this,[[0,6]])}));function e(){return t.apply(this,arguments)}return e}(),methods:{connectSocket:function(){var t=this;return new Promise(function(){var e=Object(c["a"])(regeneratorRuntime.mark(function e(n){var a;return regeneratorRuntime.wrap(function(e){while(1)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,Object(u["a"])({dataTargetArray:t.REQUIRED_JSONID_ARRAY,jwt:t.$store.state.token});case 3:a=e.sent,a.on(f["d"].DATA_UPDATED,function(e){t.statusDataDic=Object(s["a"])({},t.statusDataDic,e)}),a.on(f["d"].DISCONNECTED,function(){t.socket=null}),n(a),e.next=12;break;case 9:e.prev=9,e.t0=e["catch"](0),n(null);case 12:case"end":return e.stop()}},e,null,[[0,9]])}));return function(t){return e.apply(this,arguments)}}())},fetchJsonData:function(){var t=this;return new Promise(function(){var e=Object(c["a"])(regeneratorRuntime.mark(function e(n){return regeneratorRuntime.wrap(function(e){while(1)switch(e.prev=e.next){case 0:if(!t.busy_fetchJsonData){e.next=2;break}return e.abrupt("return",n());case 2:return Object(o["d"])(""),t.busy_fetchJsonData=!0,e.prev=4,e.next=7,t.jsonFetcher.fetchData();case 7:t.statusDataDic=e.sent,t.connectSocket().catch(),e.next=15;break;case 11:e.prev=11,e.t0=e["catch"](4),console.log(e.t0),Object(o["d"])("[fetchJsonData] ".concat(e.t0.message));case 15:return t.busy_fetchJsonData=!1,e.abrupt("return",n());case 17:case"end":return e.stop()}},e,null,[[4,11]])}));return function(t){return e.apply(this,arguments)}}())}}}),p=D,l=(n("965d"),n("2877")),_=Object(l["a"])(p,a,r,!1,null,"0bf5552a",null);e["default"]=_.exports}}]);