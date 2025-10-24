
interface PQElement<T> {
  element: T;
  priority: number;
}

export class PriorityQueue<T> {
  private items: PQElement<T>[];

  constructor() {
    this.items = [];
  }

  enqueue(element: T, priority: number) {
    const pqElement: PQElement<T> = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (pqElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, pqElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(pqElement);
    }
  }

  dequeue(): PQElement<T> | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}