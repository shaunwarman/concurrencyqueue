import {EventEmitter} from 'events';

export default class ConcurrencyQueue extends EventEmitter {
    constructor(concurrency) {
        super();

        this.concurrency = concurrency;
        this.running = 0;
        this.tasks = [];
        this.on('queue', () => {
            this.start();
        });
        this.on('task_complete', () => {
            if (this.tasks.length > 0) {
                this.start();
            }
        });
    }

    /**
     * Enqueue an async task function
     * @param task the task
     */
    enqueue(task) {
        if (typeof task !== 'function') {
            throw new Error('Task is not a function!');
        }

        this.tasks.push(task);
        this.emit('queue');
    }

    /**
     * Start the concurrent queue
     */
    start() {
        if (this.concurrency !== this.running) {
            const available = this.concurrency - this.running;
            const take = (available > this.tasks.length) ? this.tasks.length : available;
            const tasks = this.tasks.slice(0, take);
            this.tasks.splice(0, take);

            tasks.forEach((task) => {
                this.running++;
                task((error, response) => {
                    this.running--;
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(response);
                    }
                    this.emit('task_complete');
                });
            });
        }
    }
}

const asyncTask = (callback) => {
    setTimeout(() => {
        return callback(null, Math.floor(Math.random() * 100));
    }, 5000);
}

const cq = new ConcurrencyQueue(3);
cq.enqueue(asyncTask);
cq.enqueue(asyncTask);
cq.enqueue(asyncTask);
cq.enqueue(asyncTask);
cq.enqueue(asyncTask);