import VueRouter from 'vue-router'
import routes from './routes'

Vue.use(VueRouter)

const router = new VueRouter({
    // mode: 'history',
    base: __dirname,
    routes: routes
});

router.beforeEach((to,from,next)=>{
    // console.log(to,from);
    next();
});

router.afterEach((to,from)=>{
    // console.log(to,from);

});

new Vue({
    router,
    el:'#app'
});