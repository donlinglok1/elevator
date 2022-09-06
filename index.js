class Tower {
  // init
  constructor(maxFloor) {
    // const
    this.doorCloseTime = 2 * 1000;
    this.floorHeight = 98;
    this.mode = "SCAN";

    this.queue = [];

    this.elevator;
    this.doors;

    this.maxFloor = maxFloor;
    this.currentFloor = 1;
    this.isMoving = false;

    // for scan
    this.moveDirection = 'up';
    this.scanSkyBtn;
    this.scanGroundBtn;

    this.setup(this.maxFloor);

    if (this.mode == "SCAN") {
      this.moveDirection = 'up';
      this.elevatorClick(this.scanSkyBtn);
    }
  }
  $(selector, el = document) {
    return el.querySelector(selector);
  }
  $$(selector, el = document) {
    return el.querySelectorAll(selector);
  }
  addStyles(el, styles) {
    Object.assign(el.style, styles);
  }
  setup(count) {
    let template = "";
    for (let i = count - 1; i >= 0; i--) {
      template += `
                <div class="ew-elevator-storey">
                    <div class="ew-elevator-controller">
                        <button type="button" direction="up" inFloor="${i + 1}" class="ew-elevator-to-top ew-elevator-btn" ${i === count - 1 ? "disabled tag=\"sky\"" : ""
        }>↑</button>
                        <button type="button" direction="down" inFloor="${i + 1}" class="ew-elevator-to-bottom ew-elevator-btn" ${i === 0 ? "disabled tag=\"ground\"" : ""
        }>↓</button>
                    </div>
                    <div class="ew-elevator-count">${i + 1}</div>
                </div>
            `;
    }
    this.elevator = this.$(".ew-elevator");
    this.doors = this.$$(".ew-elevator-door", this.elevator);
    let zoneContainer = this.$(".ew-elevator-storey-zone");
    zoneContainer.innerHTML = template;
    [...this.$$(".ew-elevator-storey", zoneContainer)].forEach(item => {
      this.floorHeight = item.offsetHeight;
      Array.from(this.$$(".ew-elevator-btn", item)).forEach((btn) => {
        if (btn.getAttribute('tag') == "sky") {
          this.scanSkyBtn = btn;
        } else if (btn.getAttribute('tag') == "ground") {
          this.scanGroundBtn = btn;
        }
        btn.addEventListener("click", () => {
          if (btn.classList.contains("checked")) {
            return;
          }
          btn.setAttribute('disabled', true);
          btn.classList.add("checked");
          this.elevatorClick(btn);
        });
      });
    });
  }
  toQueueTail(tempIndex) {
    let tempObj = this.queue[tempIndex];
    if (tempObj != undefined) {
      this.queue.splice(tempIndex, 1);
      this.queue.unshift(tempObj);
    }
  }
  moveToNext() {
    let tempObj = this.queue.shift();
    let btn = tempObj.btn;
    let offset = tempObj.offset;
    let num = tempObj.floor;

    this.isMoving = true;

    const diffFloor = Math.abs(num - this.currentFloor);

    this.addStyles(this.elevator, {
      transitionDuration: diffFloor + "s",
      bottom: offset + "px",
    });

    // wait for elevator move to target floor
    setTimeout(() => {
      // open door
      Array.from(this.doors).forEach((door) => {
        door.classList.add("toggle");
        this.addStyles(door, {
          animationDelay: 0 + "s",
        });
        btn.removeAttribute("disabled");
      });

      // close door
      setTimeout(() => {
        this.isMoving = false;

        Array.from(this.doors).forEach((door) => door.classList.remove("toggle"));

        this.processNext();
      }, this.doorCloseTime);

      btn.classList.remove("checked");
    }, diffFloor * 1000);

    this.currentFloor = num;
  }
  processNext() {
    if (this.mode == "SSTF") {
      // SSTF-Shortest Seek Time First
      let closest;
      let tempIndex = 0;
      this.queue.forEach((obj, index) => {
        if (obj.floor != this.currentFloor) {
          let diff = obj.floor - this.currentFloor;
          if (index == 0) {
            closest = diff;
          }
          if ((diff > 0 && closest > diff) || (diff < 0 && closest > Math.abs(diff))) {
            closest = diff;
            tempIndex = index;
          }
        }
      });
      this.toQueueTail(tempIndex);
    } else if (this.mode == "SCAN") {
      // SCAN
      if (this.moveDirection == 'down') {
        let haveGroundBtn = false;
        this.queue.forEach((obj) => {
          if (obj.floor == 1) {
            haveGroundBtn = true;
          }
        });
        if (!haveGroundBtn && this.currentFloor != 1) {
          this.moveDirection = 'down';
          this.elevatorClick(this.scanGroundBtn);
          this.queue = this.queue.sort((a, b) => {
            return b.floor - a.floor;
          });
        } else if (this.currentFloor == 1) { // go back to top
          this.moveDirection = 'up';
          this.elevatorClick(this.scanSkyBtn);
          this.queue = this.queue.sort((a, b) => {
            return a.floor - b.floor;
          });
        }
      } else { //go up
        let haveSkyBtn = false;
        this.queue.forEach((obj) => {
          if (obj.floor == this.maxFloor) {
            haveSkyBtn = true;
          }
        });
        if (!haveSkyBtn && this.currentFloor != this.maxFloor) {
          this.moveDirection = 'up';
          this.elevatorClick(this.scanSkyBtn);
          this.queue = this.queue.sort((a, b) => {
            return a.floor - b.floor;
          });
        } else if (this.currentFloor == this.maxFloor) { // go back to ground
          this.moveDirection = 'down';
          this.elevatorClick(this.scanGroundBtn);
          this.queue = this.queue.sort((a, b) => {
            return b.floor - a.floor;
          });
        }
      }
    } else if (this.mode == "LOOK") {
      // LOOK
    } else if (this.mode == "SATF") {
    }

    console.log(JSON.stringify(this.queue));
    if (this.queue.length > 0) {
      this.moveToNext();
    } else {
      if (this.mode == "SCAN") {
        // this.moveToNext();
      }
    }
  }
  elevatorClick(button) {
    let canAdd = true;

    if (canAdd) {
      // FCFS-First Come First Serve
      this.queue.push({
        offset: this.floorHeight * (button.getAttribute('inFloor') - 1),
        floor: button.getAttribute('inFloor'),
        direction: button.getAttribute('direction'),
        btn: button,
      });
    }

    if (this.queue.length === 1 && !this.isMoving)
      this.processNext();
  }
}

