var store=require('../js/store');
var vueTouch = require('vue-touch');
Vue.use(vueTouch);



Vue.component('index', require('./component/index/index'));




var index= new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue.js!',
        firstName:'222',
        name:'1111',
        dataarray:[1,2,3]
    },
    methods:{
        appendData:function(){
            this.dataarray.push(Math.random().toString(36).substr(2,5));
        }
    }
});



