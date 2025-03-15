import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldGroup } from '../../models/field-group.model';

@Component({
  selector: 'app-field-groups-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field-groups-panel.component.html',
  styleUrls: ['./field-groups-panel.component.scss']
})
export class FieldGroupsPanelComponent {
  @Input() fieldGroups: FieldGroup[] = [];
  @Input() selectedGroupId: string | null = null;
  @Output() createGroup = new EventEmitter<void>();
  @Output() selectGroup = new EventEmitter<FieldGroup>();
  @Output() editGroup = new EventEmitter<FieldGroup>();
  @Output() deleteGroup = new EventEmitter<FieldGroup>();

  onCreateGroup(): void {
    this.createGroup.emit();
  }

  onSelectGroup(group: FieldGroup): void {
    this.selectGroup.emit(group);
  }
  
  onEditGroup(group: FieldGroup, event: MouseEvent): void {
    event.stopPropagation();
    this.editGroup.emit(group);
  }
  
  onDeleteGroup(group: FieldGroup, event: MouseEvent): void {
    event.stopPropagation();
    this.deleteGroup.emit(group);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return name.charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
} 