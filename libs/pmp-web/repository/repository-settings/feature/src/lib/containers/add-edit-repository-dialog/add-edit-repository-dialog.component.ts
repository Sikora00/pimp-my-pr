import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RepositoryFacade } from '@pimp-my-pr/pmp-web/repository/data-access';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TimeUnit } from '@pimp-my-pr/shared/domain';
import {
  AddEditRepositoryDialogData,
  AddRepositoryPayload,
  EditRepositoryPayload,
  Repository
} from '@pimp-my-pr/pmp-web/repository/domain';
import { SnackbarService } from '@pimp-my-pr/pmp-web/shared/domain';
import { AddEditRepositoryDialogService } from './add-edit-repository-dialog.service';
import { Router } from '@angular/router';
import { ApiException } from '@pimp-my-pr/pmp-web/shared/domain';

@UntilDestroy()
@Component({
  selector: 'pmp-add-repository-dialog',
  templateUrl: './add-edit-repository-dialog.component.html',
  styleUrls: ['./add-edit-repository-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditRepositoryDialogComponent implements OnInit, OnDestroy {
  dialogTitle: string;
  form: FormGroup;
  maxWaitingTimeFormControl: FormControl;
  repositoryToEdit: Repository;
  submitMsg: string;
  timeUnitFormControl: FormControl;
  TimeUnit = TimeUnit;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditRepositoryDialogData,
    private repoFacade: RepositoryFacade,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddEditRepositoryDialogComponent>,
    private snackbarService: SnackbarService,
    private router: Router,
    private addEditRepositoryDialogService: AddEditRepositoryDialogService
  ) {
    if (data) {
      this.dialogTitle = data.dialogTitle;
      this.repositoryToEdit = data.repositoryToEdit;
      this.submitMsg = data.submitMsg;
    }
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    this.initForm();
    this.initializeMaxWaitingTimeDefinitionControls();
  }

  initForm(): void {
    this.form = this.addEditRepositoryDialogService.initForm(this.repositoryToEdit);
  }

  initializeMaxWaitingTimeDefinitionControls(): void {
    this.maxWaitingTimeFormControl = this.form.get(
      'maxWaitingTimeDefinition.maxWaitingTime'
    ) as FormControl;

    this.timeUnitFormControl = this.form.get('maxWaitingTimeDefinition.timeUnit') as FormControl;

    this.maxWaitingTimeFormControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(this.updateTimeUnitValidation);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { maxLines, repositoryUrl, maxPrs } = this.form.value;

    const maxWaitingTime = this.maxWaitingTimeFormControl.value
      ? this.maxWaitingTimeFormControl.value * this.timeUnitFormControl.value
      : null;

    if (this.repositoryToEdit) {
      this.editRepository({
        maxLines,
        maxWaitingTime,
        maxPrs,
        repositoryId: this.repositoryToEdit.id
      });
    } else {
      this.addRepository(repositoryUrl, maxLines, maxWaitingTime, maxPrs);
    }
  }

  updateTimeUnitValidation = (maxWaitingTime: number) => {
    if (maxWaitingTime && maxWaitingTime > 0) {
      this.timeUnitFormControl.setValidators(Validators.required);
      this.timeUnitFormControl.markAsTouched();
      this.timeUnitFormControl.enable();
    } else {
      this.timeUnitFormControl.markAsUntouched();
      this.timeUnitFormControl.disable();
      this.timeUnitFormControl.clearValidators();
    }

    this.timeUnitFormControl.updateValueAndValidity();
  };

  private addRepository(
    repositoryUrl: string,
    maxLines: number,
    maxWaitingTime: number,
    maxPrs: number
  ): void {
    this.repoFacade
      .addRepository({
        repositoryUrl,
        maxLines,
        maxWaitingTime,
        maxPrs
      })
      .subscribe(
        payload => {
          this.snackbarService.open('Repository has been added');
          this.router.navigate(['repositories', payload.repository.id]);
          this.dialogRef.close();
        },
        (error: ApiException) => {
          this.snackbarService.open(error.message);
        }
      );
  }

  private editRepository(payload: EditRepositoryPayload): void {
    this.repoFacade.editRepository(payload).subscribe(
      () => {
        this.snackbarService.open('Repository has been updated');
        this.dialogRef.close();
      },
      error => {
        this.snackbarService.open('Something went wrong. Repository was not updated');
      }
    );
  }
}
