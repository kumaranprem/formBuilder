import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { FormElement, FormElementType, ElementCategory, ELEMENT_CATEGORIES } from '../../models/field-group.model';

@Component({
  selector: 'app-available-elements-panel',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './available-elements-panel.component.html',
  styleUrls: ['./available-elements-panel.component.scss']
})
export class AvailableElementsPanelComponent implements AfterViewInit {
  @Input() availableElements: FormElement[] = [];
  @Input() targetList!: CdkDropList;
  @ViewChild('rightList') rightList!: CdkDropList;
  
  searchTerm: string = '';
  filteredElements: FormElement[] = [];
  categories: string[] = Object.values(ElementCategory);
  
  ngAfterViewInit() {
    // Ensure available elements have unique IDs and categories
    this.availableElements = this.availableElements.map(element => {
      if (!element.id) {
        return {
          ...element,
          id: crypto.randomUUID()
        };
      }
      return element;
    });
    
    // Set categories for all elements
    this.availableElements = this.availableElements.map(element => {
      return {
        ...element,
        category: this.getCategoryForType(element.type)
      };
    });
    
    this.filteredElements = [...this.availableElements];
  }
  
  getCategoryForType(type: FormElementType): ElementCategory {
    for (const [category, types] of Object.entries(ELEMENT_CATEGORIES)) {
      if (types.includes(type)) {
        return category as ElementCategory;
      }
    }
    return ElementCategory.Advanced;
  }
  
  filterElements() {
    if (!this.searchTerm.trim()) {
      this.filteredElements = [...this.availableElements];
      return;
    }
    
    const term = this.searchTerm.toLowerCase();
    this.filteredElements = this.availableElements.filter(element => 
      element.type.toLowerCase().includes(term) || 
      this.getElementDescription(element.type).toLowerCase().includes(term)
    );
  }
  
  hasElementsInCategory(category: string): boolean {
    return this.getElementsInCategory(category).length > 0;
  }
  
  getElementsInCategory(category: string): FormElement[] {
    return this.filteredElements.filter(element => 
      element.category === category
    );
  }
  
  getElementIcon(type: string): string {
    switch (type) {
      case FormElementType.Text:
        return 'Aa';
      case FormElementType.Number:
        return '123';
      case FormElementType.Email:
        return '✉';
      case FormElementType.Checkbox:
        return '☑';
      case FormElementType.Select:
        return '▼';
      case FormElementType.Radio:
        return '◉';
      case FormElementType.TextArea:
        return '¶';
      case FormElementType.Date:
        return '📅';
      case FormElementType.Time:
        return '⏱️';
      case FormElementType.DateTime:
        return '📆';
      case FormElementType.Upload:
        return '📎';
      default:
        return '📋';
    }
  }
  
  getElementDescription(type: string): string {
    switch (type) {
      case FormElementType.Text:
        return 'Single line text input';
      case FormElementType.Number:
        return 'Numeric input field';
      case FormElementType.Email:
        return 'Email address input';
      case FormElementType.Checkbox:
        return 'True/false checkbox';
      case FormElementType.Select:
        return 'Dropdown selection';
      case FormElementType.Radio:
        return 'Single selection radio buttons';
      case FormElementType.TextArea:
        return 'Multi-line text input';
      case FormElementType.Date:
        return 'Date picker';
      case FormElementType.Time:
        return 'Time picker';
      case FormElementType.DateTime:
        return 'Date and time picker';
      case FormElementType.Upload:
        return 'File upload field';
      default:
        return 'Form field';
    }
  }
} 