module.exports=Vue.component('my-component', {
    template: require('./index.html'),
    data: function(){
        return {
            alias: 'Heisenberg'
        }
    },
    props: {
        // 只检测类型
        message: String,
        // 检测类型 + 其它验证
        dataarray: {
            type: Array,
            required: true
        }
    },
    methods:{
        removeData:function(){
            this.dataarray.shift();
        }
    }
});


