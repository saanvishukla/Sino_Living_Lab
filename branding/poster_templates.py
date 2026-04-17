import redis
import json
from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime
import uuid
from abc import ABC, abstractmethod

class PosterTemplate(ABC):
    def __init__(self, floor_data):
        self.floor_data = floor_data
        self.width = 800
        self.height = 1200
        self.padding = 50
        
    @abstractmethod
    def get_colors(self):
        pass
    
    @abstractmethod
    def get_template_name(self):
        pass
    
    def load_fonts(self):
        chinese_fonts = [
            "/System/Library/Fonts/PingFang.ttc",
            "/System/Library/Fonts/STHeiti Light.ttc",
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
        ]
        
        font_path = None
        for path in chinese_fonts:
            if os.path.exists(path):
                font_path = path
                break
        
        if not font_path:
            font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
            
        try:
            title_font = ImageFont.truetype(font_path, 36)
            header_font = ImageFont.truetype(font_path, 28)
            body_font = ImageFont.truetype(font_path, 22)
            small_font = ImageFont.truetype(font_path, 18)
        except:
            title_font = ImageFont.load_default()
            header_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
            
        return title_font, header_font, body_font, small_font
    
    def wrap_text(self, text, font, max_width, draw):
        lines = []
        words = text.split()
        
        if not words:
            return [text]
            
        current_line = []
        for word in words:
            test_line = ' '.join(current_line + [word])
            try:
                w = draw.textlength(test_line, font=font)
            except AttributeError:
                w, _ = draw.textsize(test_line, font=font)
                
            if w <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)
                    current_line = []
        
        if current_line:
            lines.append(' '.join(current_line))
            
        return lines
    
    @abstractmethod
    def create(self):
        pass

class GridLayoutTemplate(PosterTemplate):
    def get_template_name(self):
        return "grid_layout"
    
    def get_colors(self):
        return {
            'bg': (248, 250, 252),
            'card_bg': (255, 255, 255),
            'primary': (30, 64, 175),
            'text': (15, 23, 42),
            'border': (226, 232, 240)
        }
    
    def create(self):
        colors = self.get_colors()
        image = Image.new('RGB', (self.width, self.height), colors['bg'])
        draw = ImageDraw.Draw(image)
        
        title_font, header_font, body_font, small_font = self.load_fonts()
        
        current_y = self.padding
        
        header_path = os.path.join(os.path.dirname(__file__), "images/1.png")
        if os.path.exists(header_path):
            try:
                header_img = Image.open(header_path)
                header_w, header_h = header_img.size
                ratio = (self.width - 2 * self.padding) / header_w
                new_h = int(header_h * ratio)
                header_img = header_img.resize((self.width - 2 * self.padding, new_h), Image.Resampling.LANCZOS)
                image.paste(header_img, (self.padding, self.padding))
                current_y = self.padding + new_h + 30
            except:
                current_y = self.padding + 30
        
        sorted_floors = sorted(self.floor_data.keys(), key=lambda x: int(x) if x.isdigit() else 999)
        
        for floor in sorted_floors:
            card_x = self.padding
            card_y = current_y
            card_width = self.width - 2 * self.padding
            
            tenants = self.floor_data[floor]
            card_height = 60 + len(tenants) * 32
            
            draw.rounded_rectangle([card_x, card_y, card_x + card_width, card_y + card_height], 
                                  radius=12, fill=colors['card_bg'], outline=colors['border'], width=2)
            
            draw.rectangle([card_x + 8, card_y + 12, card_x + 12, card_y + card_height - 12], fill=colors['primary'])
            
            floor_text = f"FLOOR {floor}"
            draw.text((card_x + 25, card_y + 18), floor_text, font=header_font, fill=colors['primary'])
            
            tenant_y = card_y + 55
            for tenant in tenants:
                draw.ellipse([card_x + 25, tenant_y + 6, card_x + 33, tenant_y + 14], fill=colors['primary'])
                
                tenant_text = tenant
                max_width = card_width - 70
                wrapped = self.wrap_text(tenant_text, body_font, max_width, draw)
                
                for line in wrapped:
                    draw.text((card_x + 45, tenant_y), line, font=body_font, fill=colors['text'])
                    tenant_y += 32
                    
                    if tenant_y > card_y + card_height - 10:
                        break
                        
                if tenant_y > card_y + card_height - 10:
                    break
            
            current_y = card_y + card_height + 20
            if current_y > self.height - self.padding:
                break
        
        return image

class TimelineStyleTemplate(PosterTemplate):
    def get_template_name(self):
        return "timeline_style"
    
    def get_colors(self):
        return {
            'bg': (255, 255, 255),
            'line': (156, 163, 175),
            'node': (79, 70, 229),
            'text': (17, 24, 39),
            'floor_bg': (238, 242, 255)
        }
    
    def create(self):
        colors = self.get_colors()
        image = Image.new('RGB', (self.width, self.height), colors['bg'])
        draw = ImageDraw.Draw(image)
        
        title_font, header_font, body_font, small_font = self.load_fonts()
        
        current_y = self.padding
        
        header_path = os.path.join(os.path.dirname(__file__), "images/1.png")
        if os.path.exists(header_path):
            try:
                header_img = Image.open(header_path)
                header_w, header_h = header_img.size
                ratio = (self.width - 2 * self.padding) / header_w
                new_h = int(header_h * ratio)
                header_img = header_img.resize((self.width - 2 * self.padding, new_h), Image.Resampling.LANCZOS)
                image.paste(header_img, (self.padding, self.padding))
                current_y = self.padding + new_h + 40
            except:
                current_y = self.padding + 40
        
        timeline_x = 120
        
        sorted_floors = sorted(self.floor_data.keys(), key=lambda x: int(x) if x.isdigit() else 999)
        
        for idx, floor in enumerate(sorted_floors):
            node_y = current_y + 20
            
            if idx < len(sorted_floors) - 1:
                draw.line([(timeline_x, node_y + 20), (timeline_x, current_y + 150)], fill=colors['line'], width=4)
            
            draw.ellipse([timeline_x - 15, node_y - 15, timeline_x + 15, node_y + 15], fill=colors['node'])
            draw.ellipse([timeline_x - 10, node_y - 10, timeline_x + 10, node_y + 10], fill=colors['bg'])
            
            floor_text = f"F{floor}"
            draw.text((timeline_x - 8, node_y - 8), floor_text, font=small_font, fill=colors['node'])
            
            content_x = timeline_x + 40
            content_y = current_y
            content_width = self.width - content_x - self.padding
            
            draw.rounded_rectangle([content_x, content_y, content_x + content_width, content_y + 40], 
                                  radius=8, fill=colors['floor_bg'])
            
            floor_label = f"Floor {floor}"
            draw.text((content_x + 15, content_y + 10), floor_label, font=header_font, fill=colors['node'])
            
            tenant_y = content_y + 50
            for tenant in self.floor_data[floor]:
                draw.line([(timeline_x + 15, tenant_y + 10), (content_x - 5, tenant_y + 10)], 
                         fill=colors['line'], width=2)
                
                tenant_text = tenant
                max_width = content_width - 20
                wrapped = self.wrap_text(tenant_text, body_font, max_width, draw)
                
                for line in wrapped:
                    draw.text((content_x + 10, tenant_y), line, font=body_font, fill=colors['text'])
                    tenant_y += 30
                    
                    if tenant_y > self.height - self.padding:
                        break
                        
                if tenant_y > self.height - self.padding:
                    break
            
            current_y = tenant_y + 30
            if current_y > self.height - self.padding:
                break
        
        return image

class MagazineLayoutTemplate(PosterTemplate):
    def get_template_name(self):
        return "magazine_layout"
    
    def get_colors(self):
        return {
            'bg': (255, 255, 255),
            'primary': (220, 38, 38),
            'secondary': (254, 226, 226),
            'text': (23, 23, 23),
            'accent': (127, 29, 29)
        }
    
    def create(self):
        colors = self.get_colors()
        image = Image.new('RGB', (self.width, self.height), colors['bg'])
        draw = ImageDraw.Draw(image)
        
        title_font, header_font, body_font, small_font = self.load_fonts()
        
        current_y = self.padding
        
        header_path = os.path.join(os.path.dirname(__file__), "images/1.png")
        if os.path.exists(header_path):
            try:
                header_img = Image.open(header_path)
                header_w, header_h = header_img.size
                ratio = (self.width - 2 * self.padding) / header_w
                new_h = int(header_h * ratio)
                header_img = header_img.resize((self.width - 2 * self.padding, new_h), Image.Resampling.LANCZOS)
                image.paste(header_img, (self.padding, self.padding))
                current_y = self.padding + new_h + 30
            except:
                current_y = self.padding + 30
        
        draw.rectangle([self.padding, current_y, self.width - self.padding, current_y + 6], fill=colors['primary'])
        current_y += 25
        
        sorted_floors = sorted(self.floor_data.keys(), key=lambda x: int(x) if x.isdigit() else 999)
        
        col_width = (self.width - 3 * self.padding) // 2
        left_col_x = self.padding
        right_col_x = self.padding * 2 + col_width
        
        left_y = current_y
        right_y = current_y
        use_left = True
        
        for floor in sorted_floors:
            col_x = left_col_x if use_left else right_col_x
            col_y = left_y if use_left else right_y
            
            draw.rectangle([col_x, col_y, col_x + col_width, col_y + 3], fill=colors['primary'])
            col_y += 15
            
            floor_text = f"FLOOR {floor}"
            draw.text((col_x, col_y), floor_text, font=header_font, fill=colors['accent'])
            col_y += 40
            
            for tenant in self.floor_data[floor]:
                draw.rectangle([col_x, col_y, col_x + 4, col_y + 20], fill=colors['primary'])
                
                tenant_text = tenant
                max_width = col_width - 15
                wrapped = self.wrap_text(tenant_text, small_font, max_width, draw)
                
                for line in wrapped:
                    draw.text((col_x + 12, col_y), line, font=small_font, fill=colors['text'])
                    col_y += 24
                    
                    if col_y > self.height - self.padding:
                        break
                        
                if col_y > self.height - self.padding:
                    break
            
            col_y += 30
            
            if use_left:
                left_y = col_y
            else:
                right_y = col_y
                
            use_left = not use_left
            
            if left_y > self.height - self.padding and right_y > self.height - self.padding:
                break
        
        return image

class MinimalistZenTemplate(PosterTemplate):
    def get_template_name(self):
        return "minimalist_zen"
    
    def get_colors(self):
        return {
            'bg': (250, 250, 250),
            'primary': (0, 0, 0),
            'accent': (100, 100, 100),
            'text': (40, 40, 40),
            'line': (200, 200, 200)
        }
    
    def create(self):
        colors = self.get_colors()
        image = Image.new('RGB', (self.width, self.height), colors['bg'])
        draw = ImageDraw.Draw(image)
        
        title_font, header_font, body_font, small_font = self.load_fonts()
        
        current_y = 80
        
        header_path = os.path.join(os.path.dirname(__file__), "images/1.png")
        if os.path.exists(header_path):
            try:
                header_img = Image.open(header_path)
                header_w, header_h = header_img.size
                new_w = 300
                new_h = int(header_h * (new_w / header_w))
                header_img = header_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                image.paste(header_img, (self.width - new_w - 60, 60))
                current_y = max(current_y, 60 + new_h + 60)
            except:
                current_y = 80
        
        sorted_floors = sorted(self.floor_data.keys(), key=lambda x: int(x) if x.isdigit() else 999)
        
        for idx, floor in enumerate(sorted_floors):
            offset = 80 if idx % 2 == 0 else 200
            
            floor_text = f"{floor}"
            draw.text((offset, current_y), floor_text, font=title_font, fill=colors['primary'])
            
            draw.line([(offset + 60, current_y + 20), (offset + 200, current_y + 20)], fill=colors['line'], width=1)
            
            current_y += 70
            
            for tenant in self.floor_data[floor]:
                tenant_text = tenant
                max_width = self.width - offset - 100
                wrapped = self.wrap_text(tenant_text, body_font, max_width, draw)
                
                for line in wrapped:
                    draw.text((offset + 20, current_y), line, font=body_font, fill=colors['text'])
                    current_y += 35
                    
                    if current_y > self.height - 100:
                        break
                        
                if current_y > self.height - 100:
                    break
            
            current_y += 60
            if current_y > self.height - 100:
                break
        
        return image

class InfographicStyleTemplate(PosterTemplate):
    def get_template_name(self):
        return "infographic_style"
    
    def get_colors(self):
        return {
            'bg': (255, 255, 255),
            'primary': (16, 185, 129),
            'secondary': (209, 250, 229),
            'text': (6, 78, 59),
            'accent': (52, 211, 153),
            'numbers': (5, 150, 105)
        }
    
    def create(self):
        colors = self.get_colors()
        image = Image.new('RGB', (self.width, self.height), colors['bg'])
        draw = ImageDraw.Draw(image)
        
        title_font, header_font, body_font, small_font = self.load_fonts()
        
        current_y = self.padding
        
        header_path = os.path.join(os.path.dirname(__file__), "images/1.png")
        if os.path.exists(header_path):
            try:
                header_img = Image.open(header_path)
                header_w, header_h = header_img.size
                ratio = (self.width - 2 * self.padding) / header_w
                new_h = int(header_h * ratio)
                header_img = header_img.resize((self.width - 2 * self.padding, new_h), Image.Resampling.LANCZOS)
                image.paste(header_img, (self.padding, self.padding))
                current_y = self.padding + new_h + 35
            except:
                current_y = self.padding + 35
        
        sorted_floors = sorted(self.floor_data.keys(), key=lambda x: int(x) if x.isdigit() else 999)
        
        for floor in sorted_floors:
            tenants = self.floor_data[floor]
            tenant_count = len(tenants)
            
            draw.rounded_rectangle([self.padding, current_y, self.width - self.padding, current_y + 70], 
                                  radius=15, fill=colors['secondary'])
            
            circle_x = self.padding + 40
            circle_y = current_y + 35
            circle_radius = 25
            
            draw.ellipse([circle_x - circle_radius, circle_y - circle_radius, 
                         circle_x + circle_radius, circle_y + circle_radius], 
                        fill=colors['primary'])
            
            floor_num = f"{floor}"
            draw.text((circle_x, circle_y), floor_num, font=header_font, fill=colors['bg'], anchor="mm")
            
            floor_label = f"Floor {floor}"
            draw.text((circle_x + circle_radius + 20, current_y + 15), floor_label, 
                     font=header_font, fill=colors['text'])
            
            count_text = f"{tenant_count} tenant{'s' if tenant_count != 1 else ''}"
            draw.text((circle_x + circle_radius + 20, current_y + 45), count_text, 
                     font=small_font, fill=colors['numbers'])
            
            current_y += 85
            
            for idx, tenant in enumerate(tenants, 1):
                number_x = self.padding + 30
                number_y = current_y
                
                draw.rounded_rectangle([number_x, number_y, number_x + 28, number_y + 28], 
                                      radius=5, fill=colors['accent'])
                
                num_text = f"{idx}"
                draw.text((number_x + 14, number_y + 14), num_text, font=small_font, 
                         fill=colors['bg'], anchor="mm")
                
                tenant_text = tenant
                max_width = self.width - number_x - 60
                wrapped = self.wrap_text(tenant_text, body_font, max_width, draw)
                
                for line in wrapped:
                    draw.text((number_x + 40, current_y), line, font=body_font, fill=colors['text'])
                    current_y += 32
                    
                    if current_y > self.height - self.padding:
                        break
                        
                if current_y > self.height - self.padding:
                    break
            
            current_y += 25
            if current_y > self.height - self.padding:
                break
        
        return image

TEMPLATES = {
    'grid_layout': GridLayoutTemplate,
    'timeline_style': TimelineStyleTemplate,
    'magazine_layout': MagazineLayoutTemplate,
    'minimalist_zen': MinimalistZenTemplate,
    'infographic_style': InfographicStyleTemplate
}
