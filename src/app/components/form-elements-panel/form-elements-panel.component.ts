import { Component, EventEmitter, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDropList, CdkDrag, CdkDragDrop, CdkDragHandle } from '@angular/cdk/drag-drop';
import { FormElement } from '../../models/field-group.model';

@Component({
  selector: 'app-form-elements-panel',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './form-elements-panel.component.html',
  styleUrls: ['./form-elements-panel.component.scss']
})
export class FormElementsPanelComponent implements OnChanges {
  @Input() elements: FormElement[] = [];
  @Input() groupName: string | null = null;
  @Output() elementSelected = new EventEmitter<FormElement>();
  @Output() elementDropped = new EventEmitter<CdkDragDrop<FormElement[]>>();
  @Output() elementCopied = new EventEmitter<FormElement>();
  @Output() elementDeleted = new EventEmitter<FormElement>();
  @ViewChild('middleList') middleList!: CdkDropList;

  // Make a local copy of elements to avoid reference issues
  private _elements: FormElement[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['elements']) {
      this._elements = [...(changes['elements'].currentValue || [])];
      this.elements = this._elements;
    }
  }

  onSelectElement(element: FormElement): void {
    this.elementSelected.emit(element);
  }

  onDrop(event: CdkDragDrop<FormElement[]>): void {
    // Send the event to parent component to handle
    this.elementDropped.emit(event);
  }
  
  copyElement(element: FormElement, event: MouseEvent): void {
    // Stop propagation to prevent the card selection
    event.stopPropagation();
    this.elementCopied.emit(element);
  }
  
  deleteElement(element: FormElement, event: MouseEvent): void {
    // Stop propagation to prevent the card selection
    event.stopPropagation();
    this.elementDeleted.emit(element);
  }
} 