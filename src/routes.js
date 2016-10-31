const Home = require('./main/index/index')
const Foo = { template: '<div><router-link to="/">home</router-link></div>' }
const Bar = { template: '<div><router-link to="/">home</router-link></div>' }

export default [
{ path: '/', component: Home },
{ path: '/foo', component: Foo },
{ path: '/bar', component: Bar }
]

