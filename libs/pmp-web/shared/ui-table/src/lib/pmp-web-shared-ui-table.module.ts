import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './components/table/table.component';
import { MatTableModule, MatIconModule } from '@angular/material';
import { PmpWebSharedUtilModule } from '@pimp-my-pr/pmp-web/shared/util';

@NgModule({
  imports: [CommonModule, MatTableModule, PmpWebSharedUtilModule, MatIconModule],
  declarations: [TableComponent],
  exports: [TableComponent]
})
export class PmpWebSharedUiTableModule {}