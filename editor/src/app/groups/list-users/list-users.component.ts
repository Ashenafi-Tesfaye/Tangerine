import { Breadcrumb } from './../../shared/_components/breadcrumb/breadcrumb.component';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupsService } from '../services/groups.service';
import { _TRANSLATE } from '../../shared/_services/translation-marker';
import { TangyErrorHandler } from '../../shared/_services/tangy-error-handler.service';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.css']
})
export class ListUsersComponent implements OnInit {
  users;
  usersDisplayedColumns = ['username', 'email', 'roles', 'actions']
  @ViewChild('search', {static: true}) search: ElementRef;
  title = _TRANSLATE('Assign User to Role')
  breadcrumbs:Array<Breadcrumb> = []
  groupId:string
  constructor(
    private groupsService: GroupsService,
    private errorHandler: TangyErrorHandler
  ) {
    this.groupId = window.location.hash.split('/')[2]
  }

  async ngOnInit() {
    await this.getUsersByGroup();
  }

  async getUsersByGroupAndUsername(username: string) {
    this.users = await this.groupsService.getUsersByGroupAndUsername(this.groupId, username);
  }

  async getUsersByGroup() {
    try {
      this.users = await this.groupsService.getUsersByGroup(this.groupId);
    } catch (error) {
      console.error(error);
    }
  }

  async removeUserFromGroup(username: string) {
    try {
      const removeUser = confirm(`Remove user: ${username} from Group: ${this.groupId}`);
      if (removeUser) {
        const result = await this.groupsService.removeUserFromGroup(this.groupId, username);
        this.errorHandler.handleError(_TRANSLATE('User Removed from Group Successfully'));
        this.getUsersByGroup()
      }
    } catch (error) {
      console.log(error);
    }
  }
}
