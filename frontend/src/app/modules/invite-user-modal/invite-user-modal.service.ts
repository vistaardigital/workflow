//-- copyright
// OpenProject is an open source project management software.
// Copyright (C) 2012-2021 the OpenProject GmbH
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See docs/COPYRIGHT.rdoc for more details.
//++


import { Inject, Injectable, Injector, EventEmitter } from "@angular/core";
import { HalResource } from "core-app/modules/hal/resources/hal-resource";
import { OpModalService } from "core-app/modules/modal/modal.service";
import { CurrentProjectService } from "core-components/projects/current-project.service";
import { InviteUserModalComponent } from "./invite-user.component";

/**
 * This service triggers user-invite modals to clicks on elements
 * with the attribute [invite-user-modal-augment] set.
 */
@Injectable()
export class OpInviteUserModalService {
  public close = new EventEmitter<HalResource|HalResource[]>();

  constructor(
    protected opModalService:OpModalService,
    protected currentProjectService:CurrentProjectService,
  ) {
  }

  public open(projectId:string|null = this.currentProjectService.id) {
    const modal = this.opModalService.show(
      InviteUserModalComponent,
      'global',
      { projectId },
    );

    modal
      .closingEvent
      .subscribe((modal:InviteUserModalComponent) => {
        this.close.emit(modal.data);
      });
  }
}
