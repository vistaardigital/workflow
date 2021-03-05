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
module GithubIntegration
  ##
  # Takes pull request data coming from GitHub webhook data and stores
  # them as a `GithubPullRequest`.
  # If the `GithubPullRequest` already exists, it is updated.
  #
  # Returns the `id` of the upserted `GithubPullRequest`.
  #
  # See: https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#pull_request
  class UpsertPullRequest < ::BaseServices::BaseCallable
    def self.identifier
      :upsert_github_pull_request
    end

    protected

    def perform(params)
      GithubPullRequest.upsert(extract_params(params), unique_by: :github_id)
                       .fetch(:id)
    end

    ##
    # Receives the input from the github webhook and translates them
    # to our internal representation.
    # See: https://docs.github.com/en/rest/reference/pulls
    def extract_params(params)
      {
        github_id: params.fetch('id'),
        github_user_id: github_user_id(params.fetch('user')),
        number: params.fetch('number'),
        github_html_url: params.fetch('html_url'),
        github_updated_at: params.fetch('updated_at'),
        state: params.fetch('state'),
        title: params.fetch('title'),
        body: params.fetch('body'),
        draft: bool(params.fetch('draft')),
        merged: bool(params.fetch('merged')),
        merged_by: params['merged_by'],
        merged_at: params['merged_at'],
        comments_count: params.fetch('comments'),
        review_comments_count: params.fetch('review_comments'),
        additions_count: params.fetch('additions'),
        deletions_count: params.fetch('deletions'),
        changed_files_count: params.fetch('changed_files'),
        labels: params.fetch('labels').map(|values| extract_label_values(values))
      }
    end

    def bool(value)
      ActiveRecord::Type::Boolean.new.deserialize(value)
    end

    def extract_label_values(params)
      {
        name: params.fetch(:name),
        color: params.fetch(:color),
      }
    end

    def github_user_id(params)
      GithubIntegration::UpsertGithubUser.new.call(params)
    end
  end
end
