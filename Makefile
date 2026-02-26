.PHONY: local-up local-down local-deploy local-invoke local-destroy deploy destroy

local-up:
	docker-compose up -d

local-down:
	docker-compose down

local-deploy:
	cd terraform && terraform init && terraform apply -var-file=local.tfvars -auto-approve

local-invoke:
	aws --endpoint-url=http://localhost:4566 lambda invoke \
		--function-name github-activity-tracker \
		--payload '{}' /tmp/response.json && cat /tmp/response.json

local-destroy:
	cd terraform && terraform destroy -var-file=local.tfvars -auto-approve

deploy:
	cd terraform && terraform init && terraform apply

destroy:
	cd terraform && terraform destroy
