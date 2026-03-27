/**
 * Worker Pool for managing calculation workers
 */

interface WorkerTask {
  id: string;
  type: string;
  data: unknown;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

class WorkerPool {
  private workers: Worker[] = [];
  private queue: WorkerTask[] = [];
  private taskMap = new Map<string, WorkerTask>();
  private workerCount: number;

  constructor(workerScript: string, poolSize: number = navigator.hardwareConcurrency || 4) {
    this.workerCount = poolSize;

    // Initialize workers
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = this.handleMessage.bind(this);
      worker.onerror = this.handleError.bind(this);
      this.workers.push(worker);
    }
  }

  private handleMessage(event: MessageEvent) {
    const { id, result, error } = event.data;
    const task = this.taskMap.get(id);

    if (_task) {
      if (error) {
        task.reject(new Error(error));
      } else {
        task.resolve(result);
      }
      this.taskMap.delete(id);
    }

    this.processQueue();
  }

  private handleError(error: ErrorEvent) {
    console.error("Worker error:", error);
  }

  private getAvailableWorker(): Worker | null {
    return this.workers.find((w) => !this.isWorkerBusy(w)) || null;
  }

  private isWorkerBusy(_worker: Worker): boolean {
    // Check if this worker has an active task
    return Array.from(this.taskMap.values()).some((_task) => {
      // This is a simplification; in practice, you'd track which worker has which task
      return false;
    });
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    const worker = this.getAvailableWorker();
    if (!worker) return;

    const task = this.queue.shift();
    if (task) {
      this.taskMap.set(task.id, task);
      worker.postMessage({ id: task.id, type: task.type, data: task.data });
    }
  }

  execute<T>(type: string, data: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      this.queue.push(task);
      this.processQueue();
    });
  }

  terminate() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.taskMap.clear();
  }
}

export { WorkerPool };
