#-- encoding: UTF-8

#-- copyright
# OpenProject is an open source project management software.
# Copyright (C) 2012-2021 the OpenProject GmbH
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See docs/COPYRIGHT.rdoc for more details.
#++

class Notifications::GroupMemberAlteredJob < ApplicationJob
  queue_with_priority :notification

  def perform(group, members_ids)
    member_role_ids = group_member_role_ids(group)

    each_member_role(members_ids) { |member| send_notification(member_role_ids, member) }
  end

  private

  def send_notification(group_member_role_ids, member)
    event = if all_roles_added?(member, group_member_role_ids)
              OpenProject::Events::MEMBER_CREATED
            else
              OpenProject::Events::MEMBER_UPDATED
            end

    OpenProject::Notifications.send(event,
                                    member: member)
  end

  def all_roles_added?(user_member, group_member_role_ids)
    (user_member.member_roles.map(&:inherited_from) - group_member_role_ids).empty?
  end

  def group_member_role_ids(group)
    MemberRole
      .includes(:member)
      .where(members: { user_id: group.id })
      .pluck(:id)
  end

  def each_member_role(members_ids, &block)
    Member
      .where(id: members_ids)
      .includes(:member_roles)
      .each(&block)
  end
end
