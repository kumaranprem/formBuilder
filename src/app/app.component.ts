import { Component, inject, ViewChild, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DragDropModule, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms';
import { FieldGroupService } from './services/field-group.service';
import { FormElement, FormElementType, FieldGroup, ElementCategory, ELEMENT_CATEGORIES } from './models/field-group.model';
import { BehaviorSubject } from 'rxjs';
import { FieldGroupsPanelComponent } from './components/field-groups-panel/field-groups-panel.component';
import { FormElementsPanelComponent } from './components/form-elements-panel/form-elements-panel.component';
import { AvailableElementsPanelComponent } from './components/available-elements-panel/available-elements-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DragDropModule,
    FormsModule,
    ReactiveFormsModule,
    FieldGroupsPanelComponent,
    FormElementsPanelComponent,
    AvailableElementsPanelComponent
  ],
  template: `
    <div class="app-container">
      <div class="pane-container">
        <!-- Order matters: Left panel - field groups -->
        <app-field-groups-panel
          [fieldGroups]="(fieldGroups$ | async) || []"
          [selectedGroupId]="(selectedGroup$ | async)?.id || null"
          (createGroup)="createNewGroup()"
          (selectGroup)="selectGroup($event)"
          (editGroup)="editFieldGroup($event)"
          (deleteGroup)="deleteFieldGroup($event)"
        />

        <!-- Middle panel - form elements -->
        <app-form-elements-panel
          #formElementsPanel
          [elements]="currentElements"
          [groupName]="(selectedGroup$ | async)?.name || null"
          (elementSelected)="selectElement($event)"
          (elementDropped)="drop($event)"
          (elementCopied)="copyElement($event)"
          (elementDeleted)="deleteElement($event)"
        />

        <!-- Right panel - available elements -->
        <app-available-elements-panel
          #availableElementsPanel
          [availableElements]="availableElements"
          [targetList]="middleListDropZone"
        />
      </div>

      <!-- Right Drawer for Element Properties -->
      <div class="drawer" [class.closed]="!selectedElement" *ngIf="selectedElement">
        <div class="drawer-header">
          <h2>Field Properties</h2>
          <button (click)="closeDrawer()">×</button>
        </div>
        <div class="drawer-content">
          <form (ngSubmit)="updateElement()" #elementForm="ngForm">
            <div class="form-group">
              <label>Field Name</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.name"
                name="name"
                required
              />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea
                [(ngModel)]="selectedElement.description"
                name="description"
              ></textarea>
            </div>
            
            <!-- Show placeholder for text-based inputs -->
            <div class="form-group" *ngIf="showPlaceholder(selectedElement.type)">
              <label>Placeholder</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.placeholder"
                name="placeholder"
              />
            </div>
            
            <!-- Options for Select and Radio -->
            <div class="form-group" *ngIf="showOptions(selectedElement.type)">
              <label>Options (one per line)</label>
              <textarea
                [(ngModel)]="selectedElement.options"
                name="options"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              ></textarea>
              <small class="hint">Enter each option on a new line</small>
            </div>
            
            <!-- File type for Upload -->
            <div class="form-group" *ngIf="selectedElement.type === 'Upload'">
              <label>Allowed File Types</label>
              <input
                type="text"
                [(ngModel)]="selectedElement.fileTypes"
                name="fileTypes"
                placeholder="e.g. .pdf,.jpg,.png"
              />
              <small class="hint">Comma-separated list of file extensions</small>
            </div>
            
            <div class="checkbox-group">
              <input
                type="checkbox"
                [(ngModel)]="selectedElement.required"
                name="required"
                id="required"
              />
              <label for="required">Required Field</label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-full">
              Save Changes
            </button>
          </form>
        </div>
      </div>

      <!-- Right Drawer for Group Properties -->
      <div class="drawer" [class.closed]="!editingGroup" *ngIf="editingGroup">
        <div class="drawer-header">
          <h2>Group Properties</h2>
          <button (click)="closeGroupEditDrawer()">×</button>
        </div>
        <div class="drawer-content">
          <form (ngSubmit)="updateGroup()" #groupForm="ngForm">
            <div class="form-group">
              <label>Group Name</label>
              <input
                type="text"
                [(ngModel)]="editingGroup.name"
                name="groupName"
                required
              />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea
                [(ngModel)]="editingGroup.description"
                name="groupDescription"
              ></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary btn-full">
              Save Group
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hint {
      color: #6b7280;
      font-size: 12px;
      margin-top: 4px;
      display: block;
    }
  `]
})
export class AppComponent implements AfterViewInit, OnInit {
  private fieldGroupService = inject(FieldGroupService);
  private selectedGroupSubject = new BehaviorSubject<FieldGroup | null>(null);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('elementForm') elementForm!: NgForm;
  @ViewChild('groupForm') groupForm!: NgForm;
  @ViewChild('formElementsPanel') formElementsPanel!: FormElementsPanelComponent;
  @ViewChild('availableElementsPanel') availableElementsPanel!: AvailableElementsPanelComponent;

  fieldGroups$ = this.fieldGroupService.fieldGroups$;
  selectedGroup$ = this.selectedGroupSubject.asObservable();
  selectedElement: FormElement | null = null;
  editingGroup: FieldGroup | null = null;
  middleListDropZone: CdkDropList = new CdkDropList();
  
  // Current elements loaded from the selected group
  currentElements: FormElement[] = [];

  availableElements: FormElement[] = [];

  constructor() {
    // This will be properly initialized in ngOnInit
  }

  ngOnInit() {
    // Initialize available elements with all form element types
    this.availableElements = this.generateAvailableElements();
    
    // Subscribe to the selected group changes to update current elements
    this.selectedGroup$.subscribe(group => {
      this.currentElements = group?.elements?.slice() || [];
      this.cdr.detectChanges();
    });
  }

  generateAvailableElements(): FormElement[] {
    const elements: FormElement[] = [];
    
    // Add all element types with appropriate categories
    Object.values(FormElementType).forEach(type => {
      const element: FormElement = {
        id: crypto.randomUUID(),
        type,
        name: '',
        required: false,
        category: this.getCategoryForType(type)
      };
      
      // Add defaults for specific types
      if (type === FormElementType.Select || type === FormElementType.Radio) {
        element.options = ['Option 1', 'Option 2', 'Option 3'];
      }
      
      elements.push(element);
    });
    
    return elements;
  }
  
  getCategoryForType(type: FormElementType): ElementCategory {
    for (const [category, types] of Object.entries(ELEMENT_CATEGORIES)) {
      if (types.includes(type)) {
        return category as ElementCategory;
      }
    }
    return ElementCategory.Advanced;
  }
  
  showPlaceholder(type: string): boolean {
    return [
      FormElementType.Text,
      FormElementType.Number,
      FormElementType.Email,
      FormElementType.TextArea
    ].includes(type as FormElementType);
  }
  
  showOptions(type: string): boolean {
    return [
      FormElementType.Select,
      FormElementType.Radio
    ].includes(type as FormElementType);
  }

  ngAfterViewInit() {
    // Ensure the connection is established after view initialization
    setTimeout(() => {
      if (this.formElementsPanel) {
        this.middleListDropZone = this.formElementsPanel.middleList;
        
        // Update connection when group changes
        this.selectedGroup$.subscribe(() => {
          setTimeout(() => {
            if (this.formElementsPanel && this.availableElementsPanel) {
              this.middleListDropZone = this.formElementsPanel.middleList;
              this.availableElementsPanel.targetList = this.formElementsPanel.middleList;
            }
          });
        });
      }
    });
  }

  createNewGroup(): void {
    this.editingGroup = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      elements: []
    };
  }

  editFieldGroup(group: FieldGroup): void {
    this.editingGroup = { ...group };
  }
  
  closeGroupEditDrawer(): void {
    this.editingGroup = null;
  }
  
  updateGroup(): void {
    if (!this.editingGroup) return;
    
    // Check if this is a new group by comparing with existing groups
    let isNewGroup = true;
    this.fieldGroups$.subscribe(groups => {
      isNewGroup = !groups.some(group => group.id === this.editingGroup?.id);
    });
    
    if (isNewGroup) {
      this.fieldGroupService.createFieldGroup(this.editingGroup);
    } else {
      this.fieldGroupService.updateFieldGroup({
        ...this.editingGroup
      });
    }
    
    // Select the group after creating/updating
    this.selectGroup(this.editingGroup);
    
    this.closeGroupEditDrawer();
  }
  
  deleteFieldGroup(group: FieldGroup): void {
    if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      this.fieldGroupService.deleteFieldGroup(group.id);
      
      // If this is the currently selected group, clear the selection
      if (this.selectedGroupSubject.value?.id === group.id) {
        this.selectedElement = null;
        this.selectedGroupSubject.next(null);
        this.currentElements = [];
      }
    }
  }

  selectGroup(group: FieldGroup): void {
    this.selectedGroupSubject.next(group);
    this.selectedElement = null;
    
    // Re-establish connection after group selection
    setTimeout(() => {
      if (this.formElementsPanel && this.availableElementsPanel) {
        this.middleListDropZone = this.formElementsPanel.middleList;
        this.availableElementsPanel.targetList = this.formElementsPanel.middleList;
      }
    }, 100);
  }

  selectElement(element: FormElement): void {
    this.selectedElement = { ...element };
  }

  closeDrawer(): void {
    this.selectedElement = null;
  }

  updateElement(): void {
    if (!this.selectedElement) return;

    const group = this.selectedGroupSubject.value;
    if (!group) return;

    // Update the local currentElements array first for immediate UI update
    this.currentElements = this.currentElements.map(el => 
      el.id === this.selectedElement?.id ? {...this.selectedElement} : el
    );

    // Then update the group in the service
    const updatedElements = group.elements.map((el: FormElement) =>
      el.id === this.selectedElement?.id ? this.selectedElement : el
    );

    this.fieldGroupService.updateFieldGroup({
      ...group,
      elements: updatedElements
    });

    this.closeDrawer();
  }

  drop(event: CdkDragDrop<FormElement[]>): void {
    const group = this.selectedGroupSubject.value;
    if (!group) return;
    
    console.log('Drop event:', event);

    if (event.previousContainer === event.container) {
      // Reordering within the same list
      const newElements = [...this.currentElements];
      moveItemInArray(newElements, event.previousIndex, event.currentIndex);
      
      // Update local array first for immediate UI update
      this.currentElements = newElements;
      
      // Then update the group
      this.fieldGroupService.updateFieldGroup({
        ...group,
        elements: newElements
      });
    } else {
      // Adding new element from available elements
      try {
        const draggedElement = event.item.data as FormElement;
        console.log('Dragged element:', draggedElement);
        
        // Create a completely new element
        const newElement: FormElement = {
          id: crypto.randomUUID(),
          type: draggedElement.type,
          name: `New ${draggedElement.type}`,
          description: '',
          placeholder: '',
          required: false,
          category: draggedElement.category
        };
        
        // Add default options for Select and Radio
        if (newElement.type === FormElementType.Select || newElement.type === FormElementType.Radio) {
          newElement.options = ['Option 1', 'Option 2', 'Option 3'];
        }

        // Update local array first for immediate UI update
        const newElements = [...this.currentElements];
        newElements.splice(event.currentIndex, 0, newElement);
        this.currentElements = newElements;
        
        // Then update the group
        this.fieldGroupService.updateFieldGroup({
          ...group,
          elements: newElements
        });
        
        console.log('Updated elements:', this.currentElements);
      } catch (error) {
        console.error('Error adding element:', error);
      }
    }
    
    // Force change detection
    this.cdr.detectChanges();
  }
  
  copyElement(element: FormElement): void {
    const group = this.selectedGroupSubject.value;
    if (!group) return;
    
    // Create a copy of the element with a new ID
    const copiedElement: FormElement = {
      ...element,
      id: crypto.randomUUID(),
      name: `${element.name} (Copy)`
    };
    
    // Update local array first for immediate UI update
    const newElements = [...this.currentElements, copiedElement];
    this.currentElements = newElements;
    
    // Then update the group
    this.fieldGroupService.updateFieldGroup({
      ...group,
      elements: newElements
    });
    
    // Force change detection
    this.cdr.detectChanges();
  }
  
  deleteElement(element: FormElement): void {
    const group = this.selectedGroupSubject.value;
    if (!group) return;
    
    // Remove from local array first for immediate UI update
    const newElements = this.currentElements.filter(el => el.id !== element.id);
    this.currentElements = newElements;
    
    // Then update the group
    this.fieldGroupService.updateFieldGroup({
      ...group,
      elements: newElements
    });
    
    // If the deleted element is currently selected, close the drawer
    if (this.selectedElement && this.selectedElement.id === element.id) {
      this.closeDrawer();
    }
    
    // Force change detection
    this.cdr.detectChanges();
  }
}
