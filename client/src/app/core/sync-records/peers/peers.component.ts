import {Component, Input, OnInit} from '@angular/core';
import {UserService} from '../../../shared/_services/user.service';
import {Endpoint} from './endpoint';
import {EndpointsService} from './endpoints.service';
import {PeersService} from '../_services/peers.service';
import {Message} from "./message";

@Component({
  selector: 'app-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.css']
})
export class PeersComponent implements OnInit {

  @Input() endpoints: Endpoint[];
  window: any;
  ipAddress: String;
  port: String;

  constructor(
    private endpointsService: EndpointsService,
    private readonly userService: UserService,
    private peersService: PeersService
  ) {
    this.window = window;
  }

  async ngOnInit() {
    this.endpoints = [];
    await this.getTangyP2PPermissions().then(async () => {
      await this.init().then(() => {
        this.endpointsService.initEndpoints()
          .subscribe(endpoints => this.endpoints = endpoints);
        console.log('ready');
      });
    });
  }

  async init() {
    this.endpoints = [];
    if (this.window.isCordovaApp) {
      if (window['cordova'].getAppVersion) {
        window['cordova'].getAppVersion.getVersionNumber().then(function (version) {
          document.querySelector('#p2p-results').innerHTML += 'App version: ' + version + '<br/>';
        });
      }
    }
  }

  async getTangyP2PPermissions() {
    const response: Message = await this.peersService.getTangyP2PPermissions();
    if (typeof response !== 'undefined' && response['messageType'] === 'log') {
      const logEl = document.querySelector('#p2p-results');
      logEl.innerHTML = logEl.innerHTML +  '<p>' + response['message'] + '</p>\n';
    }
  }

  async startAdvertising() {
    const message: Message = await this.peersService.startAdvertising(this.endpoints);
    if (typeof message !== 'undefined' && message.messageType === 'log') {
      const logEl = document.querySelector('#p2p-results');
      logEl.innerHTML = logEl.innerHTML +  '<p>' + message.message + '</p>\n';
    } else if (message.messageType === 'localEndpointName') {
      const el = document.querySelector('#localEndpointName');
      el.innerHTML =  '<p>Device Name: ' + message.message + '</p>\n';
    } else if (message.messageType === 'endpoints') {
      console.log('endpoints: ' + JSON.stringify(message.object));
      this.endpoints = message.object;
    } else if (message.messageType === 'payload') {
      document.querySelector('#p2p-results').innerHTML += message.message + '<br/>';
      document.querySelector('#transferProgress').innerHTML = message.message + '<br/>';
    } else if (message.messageType === 'error') {
      document.querySelector('#p2p-results').innerHTML += message.message + '<br/>';
    }
  }

  async connectToEndpoint(id, name) {
    const endpoint = id + '_' + name;
    const message: Message = await this.peersService.connectToEndpoint(endpoint);
    if (message.messageType === 'payloadReceived') {
      document.querySelector('#p2p-results').innerHTML += message.message + '<br/>';
      document.querySelector('#transferProgress').innerHTML += message.message + '<br/>';
    } else {
      document.querySelector('#p2p-results').innerHTML += message.message + '<br/>';
    }
  }

  // async pushData() {
  //   await this.peersService.pushData();
  // }
}
