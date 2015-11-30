'use strict';

const rf_merge = require('merge');

function RoundRobinEngine(f_spawn, h_conf) {
    var self = this,
        h_default_conf = {
            max:5,
            respawn:true
        };

    self.spawn = f_spawn;
    self.conf = (typeof h_conf !== 'undefined')? rf_merge(h_default_conf, h_conf) : h_default_conf;

    self.worker_pool = [];
    self.current = 0;
}
RoundRobinEngine.prototype._spawn = function(i_index){
    var self = this,
        o_worker = this.spawn();

    o_worker.on('exit', function(){
        if(o_worker.suicide && (self.conf.respawn === true)) {
            self._spawn(i_index);
        } else {
            self.worker_pool.slice(i_index, 1);
            if(self.current === i_index){
                self.current++;
            }
        }
    });
    this.worker_pool[i_index] = o_worker;
    return o_worker;
};
RoundRobinEngine.prototype.init = function(){
    for(var i = 0; i < this.conf.max; i++){
        this._spawn(i);
    }
};
RoundRobinEngine.prototype.get_worker = function(s_ip){
    if(this.current === this.conf.max ){
        this.current = 0;
    }
    var index = this.current;
    this.current++;
    var worker = this.worker_pool[index];
    if(worker.isDead){
        return this._spawn(index);
    } else {
        if(!worker.isConnected){
            throw new Error('Worker #'+worker.id+' is disconnected !');
        }
        return worker;
    }
};

module.exports = RoundRobinEngine;