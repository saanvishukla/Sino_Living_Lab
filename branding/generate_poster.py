import redis
import json
from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime
import uuid

def get_tenant_data():
    """Fetch tenant data from Redis and group by floor."""
    try:
        r = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            password=os.getenv('REDIS_PASSWORD', None),
            decode_responses=True
        )
        
        # Get all tenant keys
        keys = r.keys('tenant:*')
        tenants = []
        for key in keys:
            data = r.get(key)
            if data:
                tenants.append(json.loads(data))
        
        # Group by floor
        floors = {}
        for tenant in tenants:
            floor = str(tenant.get('floor', 'Unknown Floor'))
            if floor not in floors:
                floors[floor] = []
            
            name = tenant.get('name', 'Unnamed Tenant')
            unit = tenant.get('unit', '')
            tenant_info = f"{name} ({unit})" if unit else name
            floors[floor].append(tenant_info)
            
        return floors
    except Exception as e:
        print(f"Error connecting to Redis: {e}")
        return {}

def wrap_text(text, font, max_width, draw):
    """Wrap text to fit within a given width."""
    lines = []
    words = text.split()
    
    if not words:
        return [text]
        
    current_line = []
    for word in words:
        test_line = ' '.join(current_line + [word])
        # Use getlength for modern Pillow, fallback to textsize if needed
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
                # Word itself is too long, force it on its own line
                lines.append(word)
                current_line = []
    
    if current_line:
        lines.append(' '.join(current_line))
        
    return lines

def create_poster(floor_data):
    """Create a poster with a header image, brown background, and white text."""
    # Poster settings
    width, height = 800, 1200
    background_color = (139, 69, 19)  # SaddleBrown
    text_color = (255, 255, 255)      # White
    padding = 50
    line_spacing = 30
    section_spacing = 60
    
    # Create image
    image = Image.new('RGB', (width, height), background_color)
    draw = ImageDraw.Draw(image)
    
    # --- ADD HEADER IMAGE ---
    header_path = os.path.join(os.path.dirname(__file__), "images/1.png")
    current_y = padding
    
    if os.path.exists(header_path):
        try:
            header_img = Image.open(header_path)
            # Resize header to fit width while maintaining aspect ratio
            header_w, header_h = header_img.size
            ratio = (width - 2 * padding) / header_w
            new_h = int(header_h * ratio)
            header_img = header_img.resize((width - 2 * padding, new_h), Image.Resampling.LANCZOS)
            
            # Paste header image
            image.paste(header_img, (padding, padding))
            current_y = padding + new_h + section_spacing
        except Exception as e:
            print(f"Error loading header image: {e}")
            current_y = padding + section_spacing
    else:
        # If no header image, use the title as before
        try:
            # Common macOS font paths
            bold_font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
            if not os.path.exists(bold_font_path):
                bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            
            if os.path.exists(bold_font_path):
                bold_font = ImageFont.truetype(bold_font_path, 32)
            else:
                bold_font = ImageFont.load_default()
        except:
            bold_font = ImageFont.load_default()
            
        title_text = "Building Directory"
        draw.text((width // 2, padding), title_text, font=bold_font, fill=text_color, anchor="mm")
        current_y = padding + section_spacing

    # --- REST OF THE POSTER ---
    # Try to load fonts
    try:
        # Priority list for Chinese-supporting fonts on macOS
        chinese_fonts = [
            "/System/Library/Fonts/PingFang.ttc",
            "/System/Library/Fonts/STHeiti Light.ttc",
            "/System/Library/Fonts/STHeiti Medium.ttc",
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
            "/System/Library/Fonts/AppleGothic.ttf",
            "/System/Library/Fonts/AppleSDGothicNeo.ttc",
            "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc", # Hiragino Sans
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
        ]
        
        font_path = None
        for path in chinese_fonts:
            if os.path.exists(path):
                font_path = path
                break
        
        if not font_path:
            # Fallback to Arial if no Chinese font found
            font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
            bold_font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
        else:
            bold_font_path = font_path # PingFang etc. are often TTC (collections)
            
        if not os.path.exists(font_path):
            font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
            bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 24)
            bold_font = ImageFont.truetype(bold_font_path, 32)
        else:
            font = ImageFont.load_default()
            bold_font = ImageFont.load_default()
    except Exception as e:
        print(f"Error loading fonts: {e}")
        font = ImageFont.load_default()
        bold_font = ImageFont.load_default()

    sorted_floors = sorted(floor_data.keys(), key=lambda x: int(x) if x.isdigit() else 999)
    
    for floor in sorted_floors:
        # Draw Floor Header (Bold)
        floor_header = f"Floor {floor}"
        draw.text((padding, current_y), floor_header, font=bold_font, fill=text_color)
        current_y += 45
        
        # Draw Tenants
        for tenant in floor_data[floor]:
            tenant_text = f"• {tenant}"
            max_text_width = width - (padding * 2) - 20
            wrapped_lines = wrap_text(tenant_text, font, max_text_width, draw)
            
            for line in wrapped_lines:
                draw.text((padding + 20, current_y), line, font=font, fill=text_color)
                current_y += line_spacing
                
                # Check if we're running out of space
                if current_y > height - padding:
                    break
            
            if current_y > height - padding:
                break
        
        current_y += section_spacing
        if current_y > height - padding:
            break

    # Save the poster
    output_path = os.path.join(os.path.dirname(__file__), "poster.png")
    image.save(output_path)
    print(f"Poster saved to {output_path}")
    
    return output_path

def save_poster_to_redis(poster_path, floor_data):
    """Save poster metadata to Redis."""
    try:
        r = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            password=os.getenv('REDIS_PASSWORD', None),
            decode_responses=True
        )
        
        # Generate unique poster ID
        poster_id = str(uuid.uuid4())
        
        # Create poster metadata
        poster_metadata = {
            'id': poster_id,
            'filename': os.path.basename(poster_path),
            'filepath': poster_path,
            'created_at': datetime.now().isoformat(),
            'floor_count': len(floor_data),
            'tenant_count': sum(len(tenants) for tenants in floor_data.values()),
            'floors': list(floor_data.keys())
        }
        
        # Save to Redis with key pattern: poster:{id}
        redis_key = f"poster:{poster_id}"
        r.set(redis_key, json.dumps(poster_metadata))
        
        # Add to posters set for easy retrieval
        r.sadd('posters', poster_id)
        
        print(f"Poster metadata saved to Redis with ID: {poster_id}")
        return poster_id
        
    except Exception as e:
        print(f"Error saving poster to Redis: {e}")
        return None

if __name__ == "__main__":
    data = get_tenant_data()
    if not data:
        print("No tenant data found in Redis. Using sample data for demonstration.")
        # Sample data if Redis is empty or unavailable
        data = {
            "1": ["Cafe Java (101)", "Flower Shop (102)"],
            "2": ["Tech Solutions (201)", "Creative Studio (202)"],
            "3": ["Global Logistics (301)"],
            "4": ["Penthouse Suite (401)"]
        }
    
    poster_path = create_poster(data)
    save_poster_to_redis(poster_path, data)
