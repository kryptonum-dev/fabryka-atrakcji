# Activities Video Gallery Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding YouTube video support to the activities gallery while maintaining backward compatibility with existing images. The implementation will be based on the existing video gallery functionality in the Case Study section, adapted for the Activities page requirements.

## Current State Analysis

### Existing Implementation

- **Activities Collection**: Currently uses `imageList` field (array of images)
- **Hero Component**: Displays up to 4 images in a grid layout with a popup for viewing all images
- **Case Study Gallery**: Already has mixed media support (images + YouTube videos) with popup navigation

### Key Differences from Case Study

- **Navigation**: Activities gallery should NOT have prev/next arrows (as per requirements)
- **Layout**: Activities hero has a different grid structure than case studies
- **Popup Style**: Simpler popup without navigation controls

## Implementation Strategy

### 1. Sanity CMS Changes

#### 1.1 Update Activities_Collection Schema

**File**: `apps/sanity/schema/collectionTypes/Activities_Collection.ts`

**Changes**:

- Rename `imageList` to `mediaList` (with backward compatibility)
- Change field type from `array of images` to `array of media objects`
- Each media object contains:
  - `image` (required): Image for thumbnail and display
  - `youtubeId` (optional): YouTube video ID

**Implementation**:

```typescript
defineField({
  name: 'mediaList', // Renamed from imageList
  type: 'array',
  title: 'Lista zdjęć i filmów',
  description: 'Lista zdjęć i filmów wyświetlanych w sekcji hero konkretnej integracji oraz przy jej refererowaniu. Zdjęcie jest wymagane zawsze - służy jako miniaturka dla filmów.',
  validation: (Rule) =>
    Rule.required().error('Lista mediów jest wymagana').min(2).error('Przynajmniej 2 media są wymagane'),
  of: [
    {
      type: 'object',
      fields: [
        {
          type: 'image',
          name: 'image',
          title: 'Zdjęcie',
          description: 'Zdjęcie wyświetlane w galerii. Dla filmów służy jako miniaturka.',
          validation: (Rule) => Rule.required(),
        },
        {
          type: 'string',
          name: 'youtubeId',
          title: 'ID filmu z YouTube (opcjonalne)',
          description: 'Kiedy dodane, filmik z YouTube pojawi się w popupie zamiast zdjęcia. Zdjęcie wciąż będzie służyć jako miniaturka w galerii.',
          validation: (Rule) => Rule.optional(),
        },
      ],
      preview: {
        select: {
          image: 'image',
          youtubeId: 'youtubeId',
          filename: 'image.asset.originalFilename',
        },
        prepare: ({ image, youtubeId, filename }) => ({
          title: youtubeId ? `${filename} (Video)` : filename,
          media: image,
          subtitle: youtubeId ? `YouTube: ${youtubeId}` : 'Zdjęcie',
        }),
      },
    },
  ],
  group: 'general',
}),
```

#### 1.2 Migration Strategy

**Backward Compatibility**:

- Keep `imageList` field temporarily (mark as deprecated)
- Add migration logic to convert existing `imageList` to `mediaList`
- Use conditional logic in queries to handle both formats

### 2. Astro Frontend Changes

#### 2.1 Update SingleActivityPage.astro

**File**: `apps/astro/src/templates/activities/SingleActivityPage.astro`

**Changes**:

- Update GROQ query to fetch `mediaList` instead of `imageList`
- Add backward compatibility for existing `imageList` data
- Update type definitions

**Query Changes**:

```typescript
// Update ImageDataQuery to handle media objects
${ImageDataQuery('mediaList[]{image, youtubeId}')}

// Backward compatibility fallback
coalesce(
  mediaList[]{
    ${ImageDataQuery('image')}
    youtubeId
  },
  imageList[]{
    ${ImageDataQuery('.')}
    "youtubeId": null
  }
)
```

**Type Updates**:

```typescript
export type SingleActivityProps = {
  // ... existing props
  imageList?: ImageDataProps[] // Keep for backward compatibility
  mediaList?: Array<{
    image: ImageDataProps
    youtubeId?: string
  }>
  // ... rest of props
}
```

#### 2.2 Update Hero Component

**File**: `apps/astro/src/components/offer/Hero.astro`

**Changes**:

- Update component to handle both Activities (with videos) and Hotels (images only)
- Add video indicators only for Activities with YouTube IDs
- Maintain existing grid layout and sizing for both page types
- Add video popup functionality only for Activities

**Cross-Page Compatibility**:

```typescript
// Props handling with full backward compatibility
const mediaItems = (() => {
  // Activities: use mediaList (new) or imageList (backward compatibility)
  if (props._type === 'Activities_Collection') {
    return props.mediaList || props.imageList?.map(img => ({ image: img, youtubeId: null })) || []
  }
  // Hotels: always use imageList (existing behavior)
  if (props._type === 'Hotels_Collection') {
    return props.imageList?.map(img => ({ image: img, youtubeId: null })) || []
  }
  return []
})()

// Grid item rendering with conditional video indicators
{
  mediaItems.slice(0, 4).map((media, index) => (
    <div class="image-wrapper" data-has-video={!!media.youtubeId && props._type === 'Activities_Collection'}>
      <Image {...media.image} sizes={sizes} />
      {media.youtubeId && props._type === 'Activities_Collection' && (
        <div class="video-indicator">
          <svg><!-- Play icon --></svg>
        </div>
      )}
    </div>
  ))
}
```

**Key Compatibility Features**:

- **Activities**: Support `mediaList` (new) with videos + `imageList` (backward compatibility)
- **Hotels**: Continue using `imageList` exactly as before
- **Video features**: Only enabled for Activities (`_type === 'Activities_Collection'`)
- **Existing behavior**: Hotels remain completely unchanged

#### 2.3 Enhance Existing Hero Gallery

**Approach**: Keep existing gallery structure, enhance with video support

**Key Changes**:

- Add play icon overlay to video thumbnails in the 4-item grid
- Add video popup functionality (similar to case study)
- Handle popup switching (gallery popup ↔ video popup)
- Maintain all existing layouts and responsive behavior

**Two Separate Popup System**:

1. **Gallery Popup** (existing, unchanged):

   - Triggered by "View all" button
   - Shows masonry grid of all media thumbnails
   - Image thumbnails show images in same popup (existing behavior)
   - Video thumbnails have play icons but close gallery popup and open video popup
   - No video playback functionality - stays pure image gallery

2. **Video Popup** (new, completely separate):
   - Triggered by clicking any video thumbnail (hero grid or gallery)
   - Completely separate overlay dedicated only to video playback
   - Similar to case study video popup but without navigation arrows
   - Simple close button

**Click Behavior**:

- **Image thumbnail anywhere** → opens/stays in gallery popup
- **Video thumbnail anywhere** → opens video popup (closes gallery if open)
- **No mixing** → videos never play inside gallery popup

#### 2.4 Add Video Popup System

**Add new video popup to Hero.astro** (alongside existing gallery popup):

- Create completely separate video popup overlay (similar to case study)
- Add video playback capability using YouTube embeds
- Keep existing gallery popup completely unchanged
- Add simple popup switching logic (close one, open other)
- No modifications to existing masonry grid functionality

**Conditional Rendering**:

```astro
<!-- Existing gallery popup (works for both Activities and Hotels) -->
<PopupWindow>
  <!-- existing gallery popup content unchanged -->
</PopupWindow>

<!-- Video popup (only for Activities) -->
{
  props._type === 'Activities_Collection' && (
    <div class="video-popup" data-open="false">
      <div class="video-container">
        <iframe class="video-iframe" title="Video playback" />
        <button class="video-close-button">Close Video</button>
      </div>
    </div>
  )
}
```

**Page Type Compatibility**:

- **Activities**: Gallery popup + Video popup
- **Hotels**: Gallery popup only (existing behavior)

### 3. JavaScript Implementation

#### 3.1 Hero Component Script Updates

**File**: `apps/astro/src/components/offer/Hero.astro` (script section)

**Changes**:

- Update to handle media objects
- Add video popup functionality (similar to case study)
- Add popup switching logic
- Maintain existing functionality

**Key Features**:

- Video playback with YouTube embed in separate popup
- Two completely independent popup types: gallery popup (existing) and video popup (new)
- Simple popup switching (close gallery → open video, or vice versa)
- Keyboard support (ESC to close both popup types)
- Touch/mobile support
- Zero modifications to existing gallery popup functionality

**Key Functions**:

```javascript
// Check page type for video functionality
const heroSection = document.querySelector('.Hero')
const pageType = heroSection?.dataset.type
const isActivityPage = pageType === 'Activities_Collection'

// Variables for both popup types (completely separate)
const galleryPopup = document.querySelector('.popup') // existing gallery popup
const videoPopup = document.querySelector('.video-popup') // new video popup (Activities only)
const videoIframe = document.querySelector('.video-iframe') // new (Activities only)

// Direct thumbnail click handler (hero grid)
function handleThumbnailClick(media, index) {
  if (media.youtubeId && isActivityPage) {
    // Open video popup directly (Activities only)
    openVideoPopup(media)
  } else {
    // Open gallery popup (existing "View all" behavior for both page types)
    openGalleryPopup()
  }
}

// Gallery popup thumbnail click handler (masonry grid)
function handleGalleryThumbnailClick(media, index) {
  if (media.youtubeId && isActivityPage) {
    // Close gallery popup, open video popup (Activities only)
    closeGalleryPopup() // existing function
    openVideoPopup(media)
  } else {
    // Show image in gallery popup (existing behavior - works for both page types)
    // This continues to work exactly as before
  }
}

// Video popup functions (completely new - Activities only)
function openVideoPopup(media) {
  if (!isActivityPage || !videoPopup || !videoIframe) return

  videoIframe.src = `https://www.youtube.com/embed/${media.youtubeId}?autoplay=1`
  videoPopup.setAttribute('data-open', 'true')
  document.body.style.overflow = 'hidden'
}

function closeVideoPopup() {
  if (!isActivityPage || !videoPopup || !videoIframe) return

  videoIframe.src = '' // Stop video playback
  videoPopup.setAttribute('data-open', 'false')
  document.body.style.overflow = ''
}

// Keyboard support for both popups
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isActivityPage) {
      closeVideoPopup()
    }
    // existing gallery popup close logic remains unchanged for both page types
  }
})
```

### 4. Styling Updates

#### 4.1 Hero Component Styles

**File**: `apps/astro/src/components/offer/Hero.astro` (style section)

**New Styles**:

```scss
// Video indicator for thumbnails
.image-wrapper {
  position: relative;

  &[data-has-video='true'] {
    .video-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 3rem;
      height: 3rem;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      pointer-events: none;

      svg {
        width: 1.5rem;
        height: 1.5rem;
      }
    }
  }
}

// Video popup overlay (completely separate from gallery popup)
.video-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(250, 247, 247, 0.3) 0%, #faf7f7 100%);
  backdrop-filter: blur(5px);
  z-index: 1000; // Higher than gallery popup
  display: flex;
  justify-content: center;
  align-items: center;
  display: none; // Hidden by default

  &[data-open='true'] {
    display: flex;
  }
}

// Video container
.video-container {
  position: relative;
  width: 100vw;
  max-width: 80vw;
  max-height: 90vh;
  aspect-ratio: 16/9;

  .video-iframe {
    width: 100%;
    height: 100%;
    border-radius: 0.25rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
  }
}

// Video close button
.video-close-button {
  position: absolute;
  right: 1rem;
  top: -3rem;
  display: flex;
  align-items: center;
  background: var(--neutral-200, #f5f1ec);
  border-radius: 999rem;
  gap: 0.25rem;
  min-height: 2.75rem;
  padding: 0.25rem 0.6725rem 0.25rem 0.25rem;
  z-index: 1001;

  // Styles adapted from case study
  // ... (similar to case study close button)
}

// Gallery popup thumbnails with video indicators
.masonry-grid {
  .images {
    img {
      // Existing styles
    }

    // Video thumbnails in gallery popup
    .gallery-video-thumbnail {
      position: relative;

      .video-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 2.5rem;
        height: 2.5rem;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;

        svg {
          width: 1.25rem;
          height: 1.25rem;
        }
      }
    }
  }
}
```

### 5. Update Activity Preview Image References

#### 5.1 Update All Components Using First Image from imageList

**Critical Step**: Throughout the project, the first image from `imageList[0]` is used as preview/thumbnail for activities. These need to be updated to use the first object from the new `mediaList` array instead.

**Files to Update**:

1. **ActivitiesCarousel Component**:

   - `apps/astro/src/components/global/ActivitiesCarousel/index.astro`
   - Change query from `${ImageDataQuery('imageList[0]')}` to `"image": coalesce(mediaList[0].image, imageList[0])`
   - Update type definitions and access patterns

2. **Categories Page**:

   - `apps/astro/src/templates/activities/CategoriesPage.astro`
   - Update query from `${ImageDataQuery('imageList[0]')}` to first media object

3. **Activity Card in Category Listing**:

   - `apps/astro/src/components/activites/category/Listing.astro`
   - Change `{...item.imageList[0]}` to `{...item.mediaList?.[0]?.image || item.imageList?.[0]}`

4. **Blog Post CTA Component**:

   - `apps/astro/src/components/blog/post/content-pt/Cta.astro`
   - Update `{...item.imageList[0]}` to use mediaList

5. **Cart API Endpoints**:

   - `apps/astro/src/pages/api/cart/activity.ts`
   - Update query from `${ImageDataQuery('imageList[0]')}` to mediaList format

6. **Cart Utilities**:

   - `apps/astro/src/utils/cart.ts`
   - Update image access from `item.imageList.asset.url` to `item.mediaList?.[0]?.image?.asset?.url || item.imageList?.asset?.url`

7. **ActivitiesCarousel Client Component**:
   - `apps/astro/src/components/global/ActivitiesCarousel/index.astro`
   - Update image optimization logic to handle mediaList

**Implementation Pattern**:

For queries, use this pattern:

```groq
"previewImage": coalesce(
  mediaList[0].image,
  imageList[0]
)
```

For component access, use this pattern:

```typescript
const previewImage = item.mediaList?.[0]?.image || item.imageList?.[0]
```

**Type Updates**:

Update all activity-related types to include the new preview image structure:

```typescript
type ActivityPreview = {
  // ... other props
  previewImage?: ImageDataProps // New unified field
  imageList?: ImageDataProps[] // Keep for backward compatibility
  mediaList?: Array<{
    image: ImageDataProps
    youtubeId?: string
  }>
}
```

### 6. Migration and Backward Compatibility

#### 6.1 Data Migration

**Strategy**:

1. **Phase 1**: Deploy with dual field support (`imageList` + `mediaList`)
2. **Phase 2**: Migration script to convert existing data
3. **Phase 3**: Remove deprecated `imageList` field

**Migration Script** (Sanity CLI):

```javascript
// Convert existing imageList to mediaList format
export default function (client) {
  return client
    .fetch('*[_type == "Activities_Collection" && defined(imageList) && !defined(mediaList)]')
    .then((activities) => {
      const patches = activities.map((activity) => ({
        id: activity._id,
        patch: {
          set: {
            mediaList: activity.imageList.map((image) => ({
              _type: 'object',
              image: image,
              youtubeId: null,
            })),
          },
        },
      }))

      return client.transaction(patches.map((p) => client.patch(p.id, p.patch)))
    })
}
```

#### 6.2 Frontend Compatibility

**Approach**: Handle both data formats gracefully

```typescript
// In component logic
const mediaItems = (() => {
  if (props.mediaList) {
    return props.mediaList
  }
  if (props.imageList) {
    return props.imageList.map((image) => ({ image, youtubeId: null }))
  }
  return []
})()
```

### 7. Testing Strategy

#### 7.1 Test Cases

**Sanity CMS**:

- [ ] Create activity with images only
- [ ] Create activity with mixed media (images + videos)
- [ ] Create activity with videos only
- [ ] Verify backward compatibility with existing activities

**Frontend**:

**Activities Page**:

- [ ] Gallery displays correctly with images only
- [ ] Gallery displays correctly with mixed media
- [ ] Video indicators appear for video items
- [ ] Gallery popup opens correctly for images
- [ ] Video popup opens correctly for videos
- [ ] Video playback works correctly
- [ ] Popup switching works (gallery ↔ video)
- [ ] Keyboard navigation works (ESC to close both popups)
- [ ] Existing activities still work (backward compatibility)

**Hotels Page**:

- [ ] Gallery displays correctly with images (existing behavior)
- [ ] Gallery popup works exactly as before
- [ ] No video indicators appear
- [ ] No video popup functionality
- [ ] Existing hotels functionality unchanged

**Cross-Page**:

- [ ] Hero component works for both Activities and Hotels
- [ ] Mobile responsiveness maintained for both page types
- [ ] No JavaScript errors on Hotels pages

#### 7.2 Performance Testing

**Considerations**:

- [ ] Image loading performance with mixed media
- [ ] Video thumbnail loading
- [ ] Popup opening speed
- [ ] Mobile performance
- [ ] YouTube embed loading

### 8. Implementation Timeline

#### Phase 1: Sanity Schema (1-2 days)

- [ ] Update Activities_Collection schema
- [ ] Add mediaList field with backward compatibility
- [ ] Test schema changes in Sanity Studio

#### Phase 2: Preview Image Updates (1-2 days)

- [x] Update ActivitiesCarousel component to use mediaList
- [x] Update CategoriesPage query for first media object
- [x] Update category listing to use mediaList preview
- [x] Update ActivityCard query to use mediaList preview
- [x] Update blog post CTA component
- [x] Update cart API endpoints
- [x] Update cart utilities for mediaList
- [x] Test all preview images display correctly

**Files Updated:**

- ✅ `apps/astro/src/components/global/ActivitiesCarousel/index.astro` - Updated query and types to use `previewImage` field
- ✅ `apps/astro/src/templates/activities/CategoriesPage.astro` - Updated embedded carousel query to use mediaList
- ✅ `apps/astro/src/components/activites/category/Listing.astro` - Updated to use `previewImage` instead of `imageList[0]`
- ✅ `apps/astro/src/components/ui/ActivityCard/index.tsx` - Updated query and types to use `previewImage` field
- ✅ `apps/astro/src/components/blog/post/content-pt/Cta.astro` - Updated to use `previewImage` instead of `imageList[0]`
- ✅ `apps/astro/src/pages/api/cart/activity.ts` - Updated to use coalesce pattern for `previewImage`
- ✅ `apps/astro/src/utils/cart.ts` - Updated to use `previewImage` for activities with backward compatibility

**GROQ Query Pattern Used:**

```groq
"previewImage": coalesce(
  mediaList[0].image{
    ${ImageDataQuery('.')}
  },
  ${ImageDataQuery('imageList[0]')}
)
```

**Key Implementation Details:**

- All activity preview images now use the new `mediaList` field with fallback to `imageList`
- Hotels continue to use `imageList` (as expected - no video functionality for hotels)
- Cart utilities handle both activities (`previewImage`) and hotels (`imageList`)
- TypeScript types updated to reflect new field structure
- Perfect backward compatibility maintained throughout

#### Phase 3: Frontend Core (2-3 days)

- [ ] Update SingleActivityPage query and types
- [ ] Update Hero component for media support
- [ ] Add video indicators and popup functionality
- [ ] Add video popup system (similar to case study)
- [ ] Implement popup switching logic
- [ ] Test with sample data

#### Phase 4: Testing & Polish (1-2 days)

- [ ] Comprehensive testing across devices
- [ ] Performance optimization
- [ ] Bug fixes and refinements
- [ ] Documentation updates
- [ ] Mobile optimization

#### Phase 5: Migration (1 day)

- [ ] Data migration script
- [ ] Deploy with backward compatibility
- [ ] Monitor for issues

**Total Estimated Time**: 5-10 days

### 9. Risks and Mitigation

#### 9.1 Identified Risks

1. **Backward Compatibility**: Existing activities might break

   - **Mitigation**: Dual field support and gradual migration

2. **Performance Impact**: Video thumbnails and embeds

   - **Mitigation**: Lazy loading and optimized thumbnails

3. **Mobile Experience**: Video playback on mobile

   - **Mitigation**: Responsive design and touch optimization

4. **YouTube Dependencies**: External service reliability
   - **Mitigation**: Graceful fallbacks and error handling

#### 9.2 Rollback Strategy

- Keep `imageList` field functional during migration
- Feature flags to disable video functionality if needed
- Quick rollback to previous component versions

### 10. Success Criteria

#### 10.1 Functional Requirements

**Activities**:

- [ ] Activities can have mixed media (images + videos)
- [ ] Video indicators clearly show video content on Activities only
- [ ] Video popup plays videos without navigation arrows
- [ ] Backward compatibility maintained for existing Activities
- [ ] Gallery popup continues to work for images

**Hotels**:

- [ ] Hotels continue to use imageList exactly as before
- [ ] No video functionality appears on Hotels pages
- [ ] Existing Hotels gallery behavior unchanged
- [ ] No performance impact on Hotels pages

**Cross-Page**:

- [ ] Hero component works seamlessly for both page types
- [ ] Mobile experience optimized for both Activities and Hotels

#### 10.2 Performance Requirements

- [ ] No degradation in page load times
- [ ] Video thumbnails load quickly
- [ ] Popup opening remains smooth
- [ ] Mobile performance acceptable

#### 10.3 User Experience Requirements

- [ ] Intuitive video indicators
- [ ] Smooth popup transitions
- [ ] Clear video controls
- [ ] Consistent with existing design patterns

### 11. Future Enhancements

#### 11.1 Potential Additions

- **Video Thumbnails**: Custom video thumbnails instead of YouTube defaults
- **Multiple Video Platforms**: Support for Vimeo, direct video files
- **Video Metadata**: Duration, description, captions
- **Analytics**: Video play tracking
- **Autoplay Controls**: User preference for video autoplay

#### 11.2 Technical Debt

- Eventually remove `imageList` field completely
- Optimize video loading strategies
- Consider CDN for video thumbnails
- Implement proper video SEO

## Conclusion

This implementation plan provides a comprehensive approach to adding video functionality to the activities gallery while maintaining system stability and backward compatibility. The phased approach ensures minimal risk while delivering the requested functionality efficiently.

The key design decisions prioritize:

1. **Backward Compatibility**: Existing activities continue to work
2. **Simplified Interface**: No navigation arrows as requested
3. **Performance**: Optimized loading and playback
4. **Consistency**: Aligned with existing design patterns
5. **Maintainability**: Clean, documented code structure

The estimated timeline of 5-10 days allows for thorough testing and refinement, ensuring a robust implementation that meets the client's requirements.
